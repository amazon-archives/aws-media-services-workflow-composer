/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/connections", "app/ui/util", "app/api_check"],
    function($, connections, util, api_check) {

        var history_to_buttons = function(history) {
            $.each(history, function(index, item) {
                // console.log(item);
                var id = util.makeid();
                var url = item[0];
                var apiKey = item[1];
                if (index == 0) {
                    $("#input_endpoint_url").val(url);
                    $("#input_endpoint_key").val(apiKey);
                }
                var html = `<a class="dropdown-item" id="${id}" href="#">${url}</a>`;
                $("#connectionHistoryDropdownMenu").append(html);
                // add event handlers to each item to populate dialog fields
                $("#" + id).click((function() {
                    let u = url;
                    let k = apiKey;
                    return function(event) {
                        $("#input_endpoint_url").val(u);
                        $("#input_endpoint_key").val(k);
                    }
                })());
            });
        };

        var updateConnectionDialog = function() {
            var history = Array.from(connections.get_history());
            // clear the existing dropdown items
            $("#connectionHistoryDropdownMenu").empty();
            // replace with current history items
            if (history.length > 0) {
                $("#connectionHistoryMenuButton").removeClass("disabled");
                history_to_buttons(history);
            } else {
                $("#connectionHistoryMenuButton").addClass("disabled");
            }
        };

        // add a save handler for the connection dialog
        $("#save_endpoint_connection").on("click", () => {
            try {
                // trim the string, normalize the link, remove any trailing slash
                // endpoint = new URI($("#input_endpoint_url").val().trim()).normalize().replace(/\/+$/, "");
                endpoint = new URI($("#input_endpoint_url").val().trim()).normalize().toString().replace(/\/+$/, "");
                console.log("normalized to " + endpoint);
                apiKey = $("#input_endpoint_key").val().trim();
                // test the provided info before saving
                api_check.ping(endpoint, apiKey).then(function(response) {
                    // test worked
                    console.log(response);
                    connections.set_current(endpoint, apiKey);
                    hideConnectionDialog();
                    updateConnectionDialog();
                    //require("app/statemachine").getToolStateMachine().connectionChanged();
                    location.reload();
                }).catch(function(error) {
                    console.log(error);
                    setConnectionAlert("There is a problem with this endpoint connection, please fix it");
                });
            } catch (error) {
                console.log(error);
                setConnectionAlert("There is a problem with this endpoint connection, please fix it");
            }
            return true;
        });

        $("#cancel_endpoint_connection").on("click", () => {
            console.log("cancel connection");
            var current_connection = connections.get_current();
            if (current_connection) {
                console.log("testing last connection used");
                // test current connection with api-ping
                var endpoint = current_connection[0];
                var api_key = current_connection[1];
                api_check.ping(endpoint, api_key).then(function(response) {
                    // test worked
                    console.log("still working");
                    hideConnectionDialog();
                    require("app/statemachine").getToolStateMachine().connectionExists();
                }).catch(function(error) {
                    console.log("not working");
                    setConnectionAlert("There is a problem with this endpoint connection, please fix it");
                    require("app/statemachine").getToolStateMachine().noSavedConnection();
                });
            } else {
                setConnectionAlert("You must define at least one endpoint connection to continue")
            }
            return true;
        });

        

        var setConnectionAlert = function(message) {
            var html = `<div id="endpoint_connection_alert" class="m-3 alert alert-danger" role="alert">${message}</div>`;
            $("#endpoint_connection_alert").replaceWith(html);
        };

        var clearConnectionAlert = function() {
            var html = `<div id="endpoint_connection_alert"></div>`;
            $("#endpoint_connection_alert").replaceWith(html);
        };


        var showConnectionDialog = function() {
            updateConnectionDialog();
            $("#configureEndpointModal").modal('show');
        };

        var hideConnectionDialog = function() {
            updateConnectionDialog();
            $("#configureEndpointModal").modal('hide');
        };


        // only update if we have a connection
        if (connections.get_current() !== null) {
            updateConnectionDialog();
        }


        // return the module object
        return {
            "showConnectionDialog": showConnectionDialog,         
            "setConnectionAlert": setConnectionAlert,
            "clearConnectionAlert": clearConnectionAlert
        };
    });