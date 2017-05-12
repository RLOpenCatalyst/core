import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 23-08-2016.
 */
@RunWith(Cucumber.class)
@CucumberOptions(
        features = {

                "src/test/resources/catalyst/settings/gallerysetup"

                //"src/test/resources/catalyst/settings/userssetup/CreateEditDelDesigner.feature",
                //"src/test/resources/catalyst/settings/userssetup/CreateEditDelSuperadmin.feature",
                //"src/test/resources/catalyst/settings/userssetup/CreateEditDelOrgAdmin.feature",
                //"src/test/resources/catalyst/settings/devopssetup/ConfigAWSProviderWithInvalidKey.feature",
        },
        glue={"com.rl.qa"},
        tags={"@Nine,@Ten"},
        format = {"json:target/reports/json/TestRunner4.json"})
public class TestRunner4 {


}
