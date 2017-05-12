
import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;

/**
 * Created by rle0346 on 15/11/16.
 */
@RunWith(Cucumber.class)
@CucumberOptions(
        features = {

                "src/test/resources/mailApplication/EmailLoginAndLogout.feature"
        },

        tags={"@Application"},
        glue={"com.rl.qa"},
        format = {"pretty", "html:target/cucumber", "json:target/reports/json/Application.json"})



public class Mail {

}
