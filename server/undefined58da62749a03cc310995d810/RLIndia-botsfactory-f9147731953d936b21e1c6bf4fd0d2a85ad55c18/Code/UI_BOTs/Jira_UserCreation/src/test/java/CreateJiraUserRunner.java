import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by rle0346 on 28/11/16.
 */




@RunWith(Cucumber.class)
@CucumberOptions(
        features = {
                "src/test/resources/catalyst/settings/JiraScenarios/createJiraUser.feature",
        },
        tags={"@Jira"},
        glue={"com.rl.qa"},
        format = {"pretty", "html:target/cucumber", "json:target/reports/json/CreateJiraUser.json"}
)
public class CreateJiraUserRunner {


}
