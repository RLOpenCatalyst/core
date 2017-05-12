import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 05-10-2016.
 */



@RunWith(Cucumber.class)
@CucumberOptions(
        features = {
                "src/test/resources/catalyst/settings/orgsetup/1CreateOrganization.feature",
        },
        tags={"@One"},
        glue={"com.rl.qa"},
        format = {"pretty", "html:target/cucumber", "json:target/reports/json/CreateOrganizationRunner.json"}
)

public class CreateOrganizationRunner {
}
