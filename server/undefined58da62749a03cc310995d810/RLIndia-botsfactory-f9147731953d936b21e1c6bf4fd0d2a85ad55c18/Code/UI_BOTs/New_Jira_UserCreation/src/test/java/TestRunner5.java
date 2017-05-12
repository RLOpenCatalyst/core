import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 25-08-2016.
 */

@RunWith(Cucumber.class)
@CucumberOptions(
        features = {

                "src/test/resources/catalyst/settings/devopssetup"
               // "src/test/resources/catalyst/settings/gallerysetup/CreateEditDelCloudFormationTemp.feature",
                //"src/test/resources/catalyst/settings/gallerysetup/CreateEditDelDockerTemplate.feature",
                //"src/test/resources/catalyst/settings/gallerysetup/CreateEditDeleteARMTemplate.feature",
                //"src/test/resources/catalyst/settings/gallerysetup/CreateEditDelSoftwareStackTemp.feature"
        },    
        glue={"com.rl.qa"},
        tags={"@Eleven,@Twelve"},
        format = {"json:target/reports/json/TestRunner5.json"})
public class TestRunner5 {

}
