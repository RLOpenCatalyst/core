import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by RLE0372 on 05-10-2016.
 */

@RunWith(Cucumber.class)
@CucumberOptions(
        features = {
                "src/test/resources/catalyst/settings/orgsetup/DeleteOrganization.feature",
        },
        tags={"@Delete"},
        glue={"com.rl.qa"},
        format = {"pretty", "html:target/cucumber", "json:target/reports/json/DeleteOrganizationRunner.json"}
)

public class DeleteOrganizationRunner {
}
