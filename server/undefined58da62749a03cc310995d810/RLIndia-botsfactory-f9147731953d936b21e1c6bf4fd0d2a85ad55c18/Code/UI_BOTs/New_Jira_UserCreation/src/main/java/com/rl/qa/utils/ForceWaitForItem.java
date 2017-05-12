package com.rl.qa.utils;

/**
 * Created by RLE0097 on 4/20/2015.
 */
public class ForceWaitForItem {
    public static void delay(int intMilliSeconds){
        try {
            int waitTime=intMilliSeconds;
            Thread.sleep(waitTime);
            //SeleniumUtilities.Log.info("Wait :" + waitTime + " Milli Seconds\n");
        } catch (Exception e) {
            SeleniumUtilities.Log.error("Error :"+e.getMessage());
        }
    }
}
