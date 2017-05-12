import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 29-08-2016.
 */

@RunWith(Cucumber.class)
@CucumberOptions(
        features = {
                "src/test/resources/catalyst/settings/gallerysetup/CreateEditDeleteVMImageUsingProviderTypeAzure.feature",
                "src/test/resources/catalyst/settings/gallerysetup/CreateEditDelVMImageUsingProviderTypeOpenStack.feature",
                "src/test/resources/catalyst/settings/gallerysetup/CreateEditDelVMImageUsingProviderTypeAWS.feature",
                "src/test/resources/catalyst/settings/gallerysetup/CreateEditDelVMImageUsingProviderTypeVMware.feature"
        },
        glue={"com.rl.qa"},
        format = {"json:target/reports/json/TestRunner6.json"})
public class TestRunner6 {

}
