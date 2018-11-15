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
            { "name": "Encode with template",
              "label": "MediaConvert template",
              "params": {"MediaConvert template name": "string"}
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
            variable.operators = ["equal", "starts_with", "ends_with", "contains", "is_not_empty" ];
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

    $('#btn-get').on('click', function() {
        var result = $('#builder').queryBuilder('getRules');
        if (!$.isEmptyObject(result)) {
          alert(JSON.stringify(result, null, 2));
        }
        else{
            console.log("invalid object :");
        }
        console.log(result);
      });

      $('#btn-get-br').on('click', function() {
        var result = $('#builder').queryBuilder('getBusinessRules');
        if (!$.isEmptyObject(result)) {
          alert(JSON.stringify(result, null, 2));
        }
        else{
            console.log("invalid object :");
        }
        console.log(result);
      });
    
      $('#btn-reset').on('click', function() {
        $('#builder').queryBuilder('reset');
      });
    
      $('#btn-set').on('click', function() {
        //$('#builder').queryBuilder('setRules', rules_basic);
        var ruleSet = 'foo';
        var connections = requirejs('app/connections');
        var current_connection = connections.get_current();
        var CONFIG_API_BASE_URL = current_connection[0];
        var key = current_connection[1];
        const url = CONFIG_API_BASE_URL+'/rules/'+ruleSet;
        // var actions = $("#actions").actionsBuilder('data');
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

        postData(url, key, fetchInit )
            .then(function(data) {
                console.log(data)
                
                console.log("Rules POST OK")
                

            })
            .catch(error => console.error('Error fetching inital data:', error));
        
      });

      $('#btn-load').on('click', function(){
        load_rules_set("foo");
      });
    
      //When rules changed :
      $('#builder').on('getRules.queryBuilder.filter', function(e) {
          //$log.info(e.value);
      });
  }

//   function initializeActions(ruleactions, actions) {
//     actions.actionsBuilder(ruleactions);
//   }

//   ruleSet is the name of the rule in this case. 
  function load_rules_set(ruleSet){
        //$('#builder').queryBuilder('setRules', rules_basic);
        var connections = requirejs('app/connections');
        var current_connection = connections.get_current();
        var CONFIG_API_BASE_URL = current_connection[0];
        var key = current_connection[1];
        const url = CONFIG_API_BASE_URL+'/rules/'+ruleSet;
        var actionsdiv = $("#actions-load");
        var rulesdiv = $("#builder-load");

        $('#ruleset_name').html("<h2>Rule Name: "+ruleSet+"</h2>");

        getData(url, key)
            .then(function(data) {
                console.log(data)
                
                const url = CONFIG_API_BASE_URL+'/rules/variables';
                
                
                getData(url, key)
                    .then(function(vars) {
                        console.log(vars)
                        f = translateBusinessRulesFilters(vars);
                        console.log(f);
                        //FIXME - set this from stored actions not defined actions
                        // initializeActions(vars, actionsdiv);
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
        var params = location.href.split('?')[1].split('&');
        console.log("The parameter is " + params[0]);
        load_rules_set(params[0]);
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

  //$(onReady);

  

  