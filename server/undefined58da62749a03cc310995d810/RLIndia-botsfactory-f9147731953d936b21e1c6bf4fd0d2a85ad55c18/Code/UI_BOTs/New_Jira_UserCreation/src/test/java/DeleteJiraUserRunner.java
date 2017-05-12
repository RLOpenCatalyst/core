import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by test on 19-01-2017.
 */



@RunWith(Cucumber.class)
@CucumberOptions(
        features = {
                "src/test/resources/catalyst/settings/JiraScenarios/deleteJiraUser.feature",
        },
        tags={"@Jira"},
        glue={"com.rl.qa"},
        format = {"pretty", "html:target/cucumber", "json:target/reports/json/DeleteJiraUser.json"}
)
public class DeleteJiraUserRunner {


}