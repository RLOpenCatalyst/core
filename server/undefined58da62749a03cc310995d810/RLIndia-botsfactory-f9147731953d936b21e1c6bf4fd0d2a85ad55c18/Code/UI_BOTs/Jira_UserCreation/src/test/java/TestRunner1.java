//package com.rl.qa.steps;

import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 26-07-2016.
 **/

@RunWith(Cucumber.class)
@CucumberOptions(
        features = {

                "src/test/resources/catalyst/settings/orgsetup"
                //"src/test/resources/catalyst/settings/orgsetup/CreateOrganization.feature",
                //"src/test/resources/catalyst/settings/orgsetup/CreateBusinessGroup.feature",
                //"src/test/resources/catalyst/settings/orgsetup/CreateProject.feature",
                //"src/test/resources/catalyst/settings/userssetup/CreateSuperadmin.feature",




               // "src/test/resources/catalyst/settings/orgsetup/CreateEditDelOrg.feature",
               // "src/test/resources/catalyst/settings/orgsetup/CreateEditDelBGroup.feature",
               // "src/test/resources/catalyst/settings/orgsetup/CreateEditDelProject.feature",
               // "src/test/resources/catalyst/settings/configsetup/ChefServerSetup.feature",
//                "src/test/resources/catalyst/settings/orgsetup/CreateEnvUsingEnvFromChefServer.feature",
//                "src/test/resources/catalyst/settings/orgsetup/CreateEditDelEnvByCreatingNewEnv.feature",
//                "src/test/resources/catalyst/settings/devopssetup/ConfigureNexusServer.feature",
//                "src/test/resources/catalyst/settings/devopssetup/ConfigAWSProviderWithInvalidKey.feature",
//                "src/test/resources/catalyst/settings/devopssetup/ConfigureAWSProviderUsingAccessKey.feature",
//                "src/test/resources/catalyst/settings/devopssetup/ConfigureAzureProvider.feature",
//                "src/test/resources/catalyst/settings/devopssetup/ConfigureOpenStackProvider.feature",
//                "src/test/resources/catalyst/settings/devopssetup/ConfigureVMWareProvider.feature",
//                "src/test/resources/catalyst/settings/devopssetup/CreateEditDelDocker.feature",
//                "src/test/resources/catalyst/settings/devopssetup/CreateEditDelJenkins.feature",
//                "src/test/resources/catalyst/settings/userssetup/CreateEditDelDesigner.feature",
//                "src/test/resources/catalyst/settings/userssetup/CreateEditDelSuperadmin.feature",
//                "src/test/resources/catalyst/settings/userssetup/CreateEditDeleteTeams.feature",
//                "src/test/resources/catalyst/settings/userssetup/CreateEditDelOrgAdmin.feature",
        },

        tags={"@One,@Two,@Three"},
        glue={"com.rl.qa"},
        format = {"pretty", "html:target/cucumber", "json:target/reports/json/TestRunner1.json","junit:target/TestRunner1.xml"})


public class TestRunner1 {



}