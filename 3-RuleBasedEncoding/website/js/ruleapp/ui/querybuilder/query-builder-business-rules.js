/*!
 * jQuery QueryBuilder business-rules Support
 * Allows to export rules as a business-rules statement.
 * https://github.com/mistic100/jQuery-QueryBuilder
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'query-builder'], factory);
    }
    else {
        factory(root.jQuery);
    }
}(this, function($) {
"use strict";

var QueryBuilder = $.fn.queryBuilder;

// DEFAULT CONFIG
// ===============================
QueryBuilder.defaults({
    businessRulesOperators: {
        //numeric, string, boolean
        equal:          function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'equal_to'; 
                            obj["value"] = v[0]; 
                            
                            return obj
                        },
        //numeric
        not_equal:      function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'not_equal_to'; 
                            obj["value"] = v[0]; 
                            return obj
                        },
        //numeric
        less:           function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'less_than'; 
                            obj["value"] = v[0]; 
                            return obj
                        },
        //numeric
        less_or_equal:  function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'less_than_or_equal_to'; 
                            obj["value"] = v[0]; 
                            return obj
                        }, 
        //numeric
        greater:        function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'greater_than'; 
                            obj["value"] = v[0]; 
                            return obj
                        },
        //numeric
        greater_or_equal: function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'greater_than_or_equal'; 
                            obj["value"] = v[0]; 
                            return obj
                        },
        //string
        begins_with:      function(v){ return {'starts_with': v[0]}; },
        //string
        xxxxxx:  function(v){ return {'matches_regex': '^' + escapeRegExp(v[0])}; },
        //string, select
        contains:       function(v){ 
                            var obj = new Object; 
                            obj["operator"] = 'contains'; 
                            obj["value"] = v[0]; 
                            return obj
                        },
        //string
        ends_with:        function(v){ return {'ends_with': escapeRegExp(v[0]) + '$'}; },
        //select
        not_contains:     function(v){ 
                              var obj = new Object; 
                              obj["operator"] = 'does_not_contain'; 
                              obj["value"] = v[0]; 
                              return obj
                          },
                          //function(v){ return {'does_not_contain': escapeRegExp(v[0])}; }
    }
});


// PUBLIC METHODS
// ===============================
QueryBuilder.extend({
    /**
     * Get rules as business-rules query
     * @param data {object} (optional) rules
     * @return {object}
     */
    getBusinessRules: function(data) {
        data = (data===undefined) ? this.getRules() : data;

        var that = this;

        return (function parse(data) {
            if (!data.condition) {
                data.condition = that.settings.default_condition;
            }
            if (['AND', 'OR'].indexOf(data.condition.toUpperCase()) === -1) {
                error('Unable to build business-rules query with condition "{0}"', data.condition);
            }

            if (!data.rules) {
                return {};
            }

            var parts = [];

            data.rules.forEach(function(rule) {
                if (rule.rules && rule.rules.length>0) {
                    parts.push(parse(rule));
                }
                else {
                    //Map selection value from Array enumeration
                    if(rule.input === "select") {
                        var f = FILTERS.find(function (obj) { return obj.id === rule.field; });
                        if (rule.operator === "equal") {
                            rule.operator = "contains" ;

                        } else {
                            rule.operator = "not_contains" ;
                        } 
                        rule.type = "string"
                        //assume only single select allowed
                        //rule.value = f.values[rule.value];
                    }
                    
                    var mdb = that.settings.businessRulesOperators[rule.operator],
                        ope = that.getOperatorByType(rule.operator),
                        values = [];

                    if (mdb === undefined) {
                        error('Unknown business-rules operation for operator "{0}"', rule.operator);
                    }

                    if (ope.nb_inputs !== 0) {
                        if (!(rule.value instanceof Array)) {
                            rule.value = [rule.value];
                        }

                        rule.value.forEach(function(v) {
                            values.push(changeType(v, rule.type));
                        });
                    }

                    var part = {};
                    part = mdb.call(that, values);
                    part.name = rule.field
                    parts.push(part);
                }
            });

            var res = {};
            if (parts.length > 0) {
                var condition = ((data.condition.toLowerCase() === 'and') ? 'all' : 'any');
                res[ condition ] = parts;
            }
            return res;
        }(data));
    }
});


/**
 * Change type of a value to int or float
 * @param value {mixed}
 * @param type {string} 'integer', 'double' or anything else
 * @param boolAsInt {boolean} return 0 or 1 for booleans
 * @return {mixed}
 */
function changeType(value, type, boolAsInt) {
    switch (type) {
        case 'integer': return parseInt(value);
        case 'double': return parseFloat(value);
        case 'boolean':
            var bool = value.trim().toLowerCase() === "true" || value.trim() === '1' || value === 1;
            return  boolAsInt ? (bool ? 1 : 0) : bool;
        default: return value;
    }
}

/**
 * Escape value for use in regex
 * @param value {string}
 * @return {string}
 */
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


}));



