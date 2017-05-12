import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 23-08-2016.
 */
@RunWith(Cucumber.class)
@CucumberOptions(
        features = {

                "src/test/resources/catalyst/settings/userssetup",

               // "src/test/resources/catalyst/settings/configsetup/CreateEnvUsingEnvFromChefServer.feature",
                //"src/test/resources/catalyst/settings/configsetup/CreateEditDelEnvByCreatingNewEnv.feature",
                //"src/test/resources/catalyst/settings/userssetup/CreateEditDeleteTeams.feature",
                //"src/test/resources/catalyst/settings/userssetup/CreateOrgAndVerifyFourAutoCreatedTeams.feature",
        },
        tags={"@Four,@Five"},
        glue={"com.rl.qa"},
        format = {"json:target/reports/json/TestRunner2.json"})
public class TestRunner2 {

}
