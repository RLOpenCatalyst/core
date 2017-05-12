import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 06-09-2016.
 */

@RunWith(Cucumber.class)
@CucumberOptions(
        features = {
                        "src/test/resources/catalyst/settings/devopssetup/CreateEditDelDocker.feature",
                        "src/test/resources/catalyst/settings/devopssetup/CreateEditDelJenkins.feature",
                        "src/test/resources/catalyst/settings/devopssetup/ConfigureNexusServer.feature",
//                        "src/test/resources/catalyst/settings/devopssetup/ConfigAWSProviderWithInvalidKey.feature",
                        "src/test/resources/catalyst/settings/devopssetup/ConfigureAzureProvider.feature",
        },
        glue={"com.rl.qa"},
        format = {"json:target/reports/json/TestRunner7.json"})
public class TestRunner7 {

}
