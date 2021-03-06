/*
 * Copyright 2013 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

Aria.classDefinition({
    $classpath : "test.aria.templates.reloadParentTemplate.reloadGrandParentTemplate.ReloadGrandParentTemplateTestCase",
    $extends : "aria.jsunit.TemplateTestCase",
    $constructor : function () {
        this.$TemplateTestCase.constructor.call(this);

        this.data = {};
        this._initValues();
        this.setTestEnv({
            template : "test.aria.templates.reloadParentTemplate.ChildTemplate",
            data : this.data
        });

        this.cont = 0;
        this.defaultTestTimeout = 5000;
    },
    $prototype : {
        tearDown : function () {
            aria.core.IO.$removeListeners({
                "request" : {
                    fn : this._ioListener,
                    scope : this
                },
                "response" : {
                    fn : this._injectResponse,
                    scope : this
                }
            });

            aria.templates.TemplateManager.unloadTemplate("test.aria.templates.reloadParentTemplate.ChildTemplate", true, "aria.templates.Template");
        },

        runTemplateTest : function () {
            this.templateMod = "";
            this.templateScriptMod = "";
            this.gpTemplateMod = "";
            this.gpTemplateScriptMod = "";
            var url = Aria.rootFolderPath + "test/aria/templates/reloadParentTemplate/ParentTemplate";
            var gpurl = Aria.rootFolderPath
                    + "test/aria/templates/reloadParentTemplate/reloadGrandParentTemplate/GrandParentTemplate";

            // Testing the initial values
            this.assertTrue(test.aria.templates.reloadParentTemplate.ChildTemplate.classDefinition.$extends == test.aria.templates.reloadParentTemplate.ParentTemplate.classDefinition.$classpath, "Child doesn't extend parent");
            this.assertTrue(this.data.something === 0, "Data.something is not zero");
            this.assertTrue(this.data.anything === 0, "Data.anything is not zero");

            // Listen for requests sent to the server
            aria.core.IO.$on({
                "request" : {
                    fn : this._ioListener,
                    scope : this
                },
                "response" : {
                    fn : this._injectResponse,
                    scope : this
                }
            });

            aria.core.IO.asyncRequest({
                url : url + "Mod.tpl",
                callback : {
                    fn : this._afterMockLoad,
                    scope : this,
                    args : "templateMod"
                }
            });

            aria.core.IO.asyncRequest({
                url : url + "ModScript.js",
                callback : {
                    fn : this._afterMockLoad,
                    scope : this,
                    args : "templateScriptMod"
                }
            });

            aria.core.IO.asyncRequest({
                url : gpurl + "Mod.tpl",
                callback : {
                    fn : this._afterMockLoad,
                    scope : this,
                    args : "gpTemplateMod"
                }
            });

            aria.core.IO.asyncRequest({
                url : gpurl + "ModScript.js",
                callback : {
                    fn : this._afterMockLoad,
                    scope : this,
                    args : "gpTemplateScriptMod"
                }
            });
        },

        _ioListener : function (args) {
            if (args.req.url.indexOf("/ChildTemplate.tpl?") > 0) {
                this.childTemplateReloaded = true;
            }
            if (args.req.url.indexOf("/ParentTemplate.tpl?") > 0) {
                this.parentTemplateReloaded = true;
            }
            if (args.req.url.indexOf("/GrandParentTemplate.tpl?") > 0) {
                this.grandParentTemplateReloaded = true;
            }
        },

        _injectResponse : function (args) {
            // Sending back templates and template scripts with modifications.
            var response = args.req.res;
            if (response.url.indexOf("/ParentTemplate.tpl?") > 0) {
                response.responseText = this.templateMod;
            } else if (response.url.indexOf("/ParentTemplateScript.js?") > 0) {
                response.responseText = this.templateScriptMod;
            } else if (response.url.indexOf("/GrandParentTemplate.tpl?") > 0) {
                response.responseText = this.gpTemplateMod;
            } else if (response.url.indexOf("/GrandParentTemplateScript.js?") > 0) {
                response.responseText = this.gpTemplateScriptMod;
            }
        },

        _afterMockLoad : function (asyncRes, mockVar) {
            this[mockVar] = asyncRes.responseText;
            this.cont++;

            if (this.cont == 4) {
                this._reload();
            }
        },

        _reload : function () {
            // Trigger the reload for the child template
            aria.templates.TemplateManager.unloadTemplate("test.aria.templates.reloadParentTemplate.ChildTemplate", true);
            this._replaceTestTemplate({
                template : "test.aria.templates.reloadParentTemplate.ChildTemplate"
            }, this._reloadComplete);
        },

        _reloadComplete : function () {
            // Check that the child template has been reloaded
            this.assertTrue(this.childTemplateReloaded, "Child Template not reloaded");
            // Check that the parent template has been reloaded
            this.assertFalse(this.parentTemplateReloaded, "Parent Template reloaded");
            this.assertEquals(this.data.something, 0, "Data.something changed");
            // Check that the grandparent template has been reloaded
            this.assertFalse(this.grandParentTemplateReloaded, "Grandparent Template reloaded");
            this.assertEquals(this.data.anything, 0, "Data.anything changed");

            this.end();
        },

        _initValues : function () {
            this.data.something = 0;
            this.data.anything = 0;
            this.childTemplateReloaded = false;
            this.parentTemplateReloaded = false;
            this.grandParentTemplateReloaded = false;
        }
    }
});
