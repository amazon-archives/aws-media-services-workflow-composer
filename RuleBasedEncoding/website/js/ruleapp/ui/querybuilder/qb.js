var RULES_BASIC = {
    condition: 'AND',
    rules: [{
        id: 'container_format',
        operator: 'equal',
        value: 'MPEG-4'
    }]
};

var BUSINESSRULES_BASIC =
{
    "actions": [
        {
            "name": "Encode with template",
            "label": "MediaConvert template",
            "params": { "MediaConvert template name": "string" }
        }
    ],
};
//[{"name":"do_encode_with_job","params":{"job":"foo"}}]




/**
 * Translate filters from business rules backend to QueryBuilder filters
 * @param data {business rules object}
 * @return {queryBuilder filters}
 */
function translateBusinessRulesFilters(rules) {

    var filters = [];

    rules.variables.forEach(function (v) {

        var variable = {};
        variable.id = v.name;
        variable.label = v.label;
        //variable_type_operator =  data.variable_type_operators.find(function (obj) { return obj.id === rule.field; });
        // Use the most permissive type to translate "numeric"
        // We can't do any validation because the stronger types are lost in
        // translation
        if (v.field_type === "numeric") {
            variable.type = "double";
            variable.operators = ["equal", "less", "less_or_equal", "greater_or_equal", "greater"];
            //FIXME - add nulls
        }

        variable.options = [];

        if (v.field_type === "select") {
            variable.values = v.options;
            variable.type = "integer";
            variable.input = "select",
                variable.operators = ["equal", "not_equal"]
        }

        if (v.type === "string") {
            variable.operators = ["equal", "starts_with", "ends_with", "contains", "is_not_empty"];
            //FIXME - add nulls
            //Can't support matches_regex

        }

        //FIXME - support date, datetime and multiselect
        filters.push(variable);
    });

    return filters;
}

function initializeRules(filters, qbrulesin, rulesdiv) {
    //$('#builder').queryBuilder({
    rulesdiv.queryBuilder({
        plugins: ['bt-tooltip-errors'],
        filters: filters,
        rules: qbrulesin
    });

    $('#btn-get').on('click', function () {
        var result = $('#builder').queryBuilder('getRules');
        if (!$.isEmptyObject(result)) {
            alert(JSON.stringify(result, null, 2));
        }
        else {
            console.log("invalid object :");
        }
        console.log(result);
    });

    $('#btn-get-br').on('click', function () {
        var result = $('#builder').queryBuilder('getBusinessRules');
        if (!$.isEmptyObject(result)) {
            alert(JSON.stringify(result, null, 2));
        }
        else {
            console.log("invalid object :");
        }
        console.log(result);
    });

    $('#btn-get-sql').on('click', function () {
        var result = $('#builder').queryBuilder('getSQL', false, false);

        if (result.sql.length) {
            alert(result.sql + '\n\n' + JSON.stringify(result.params, null, 2));
        }
    });

    $('#btn-reset').on('click', function () {
        $('#builder').queryBuilder('reset');
    });

    $('#btn-set').on('click', function () {
        //$('#builder').queryBuilder('setRules', rules_basic);
        var connections = requirejs('app/connections');
        var current_connection = connections.get_current();
        var CONFIG_API_BASE_URL = current_connection[0];
        var CONFIG_API_KEY = current_connection[1];
        var ruleSet = $("#inputRulesetName").val();
        const url = CONFIG_API_BASE_URL + '/rules/' + ruleSet;
        const key = CONFIG_API_KEY;
        var result = "Rule was created successfully!"
        // var actions = $("#actions").actionsBuilder('data');

        //Remove previous results
        $("#result").empty()
        //Check inputs
        console.log("Rule name is " + ruleSet);
        if (ruleSet === "") {
            message = "\nInput Error: Please enter a Rule name.";
            //document.getElementById("result").innerHTML = message;
            $("#result").append('<div class="panel panel-default"><div class="panel-body">' + message + '</div></div>');
            return;
        } else {

            var qbrules = $('#builder').queryBuilder('getRules');
            var brrules = $('#builder').queryBuilder('getBusinessRules');
            var businessrules = {};
            var fetchInit = {
                method: 'POST', mode: "cors", // no-cors, cors, *same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                credentials: "same-origin", // include, same-origin, *omit
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                redirect: "follow", // manual, *follow, error
                referrer: "no-referrer", // no-referrer, *client
            };

            businessrules["qb-rules"] = qbrules;
            businessrules["conditions"] = brrules;
            // businessrules["actions"] = actions;

            fetchInit['body'] = JSON.stringify(businessrules)

            console.log(businessrules);

            postData(url, key, fetchInit)
            //fetch(url, fetchInit)
            //    .then(function (response) {
            //        return (response.json());
            //    })
                .then(function (data) {
                    console.log(data)

                    console.log("Rules POST OK")

                    document.getElementById("result").append = '<div class="panel panel-default"><div class="panel-body">' + 'Error: please enter a Rule Name.' + '</div></div>";';

                })
                .catch(error => console.error('Error fetching inital data:', error));

            $("#result").append('<div class="panel panel-default"><div class="panel-body">' + result + '</div></div>');
        }
    });

    $('#btn-load').on('click', function () {
        load_rules_set("foo");
    });

    //When rules changed :
    $('#builder').on('getRules.queryBuilder.filter', function (e) {
        //$log.info(e.value);
    });

}

function initializeActions(ruleactions, actions) {
    //noop actions.actionsBuilder(ruleactions);
}

//   ruleSet is the name of the rule in this case. 
function load_rules_set(ruleSet) {
    //$('#builder').queryBuilder('setRules', rules_basic);
    var connections = requirejs('app/connections');
    var current_connection = connections.get_current();
    var CONFIG_API_BASE_URL = current_connection[0];
    var CONFIG_API_KEY = current_connection[1];
    const url = CONFIG_API_BASE_URL + '/rules/' + ruleSet;
    var actionsdiv = $("#actions-load");
    var rulesdiv = $("#builder-load");

    fetch(url)
        .then(function (response) {
            return (response.json());
        })
        .then(function (data) {
            console.log(data)

            var connections = requirejs('app/connections');
            var current_connection = connections.get_current();
            var CONFIG_API_BASE_URL = current_connection[0];
            var CONFIG_API_KEY = current_connection[1];
            const url = CONFIG_API_BASE_URL + '/rules/variables';

            fetch(url)
                .then(function (response) {
                    return (response.json());
                })
                .then(function (vars) {
                    console.log(vars)
                    f = translateBusinessRulesFilters(vars);
                    console.log(f);
                    //FIXME - set this from stored actions not defined actions
                    initializeActions(vars, actionsdiv);
                    initializeRules(f, data['rules']['qb-rules'], rulesdiv);

                })
                .catch(error => console.error('Error fetching inital data:', error));

            //initializeRules(f, data['qb-rules']);


            //initializeActions(data['actions'], actions);
            //FIXME - set this from stored actions
            //initializeActions(vars, actionsdiv);
            //initializeForm();

        })
        .catch(error => console.error('Error fetching inital data:', error));

}

function init() {

    require(['app/connections'], function (connections) {

        if (null != connections.get_current()) {
            
            console.log(""+connections)
            //var connections = require('app/connections');
            var current_connection = connections.get_current();
            
            console.log("current connection: " + current_connection[0]);

            const url = current_connection[0] + '/rules/variables';
            const api_key = current_connection[1]
            var actionsdiv = $("#actions");
            var rulesdiv = $("#builder");
            //var actionsdiv = "#actions";
            //var rulesdiv = "#builder";

            getData(url, api_key)
                //.then(function (response) {
                //    return (response.json());
                //})
                .then(function (data) {
                    console.log(data)

                    f = translateBusinessRulesFilters(data);
                    console.log(f);
                    initializeRules(f, RULES_BASIC, rulesdiv);
                    initializeActions(data, actionsdiv);
                    //initializeForm();

                })
                .catch(error => console.error('Error fetching inital data:', error));
        }
        else {
            console.log("no current connection - set a connection to get going");
        }


        console.log("history:" + connections.get_history())        
        
    });

}

function postData(url = ``, api_key = "", data = {}) {
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            'x-api-key': api_key
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
        .then(response => response.json()); // parses response to JSON
}

function getData(url = ``, api_key = "", data = {}) {
    return fetch(url, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            'x-api-key': api_key
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
    })
        .then(response => response.json()); // parses response to JSON
}

/****************************************************************
                        Triggers and Changers QueryBuilder
*****************************************************************/

//$(init);



