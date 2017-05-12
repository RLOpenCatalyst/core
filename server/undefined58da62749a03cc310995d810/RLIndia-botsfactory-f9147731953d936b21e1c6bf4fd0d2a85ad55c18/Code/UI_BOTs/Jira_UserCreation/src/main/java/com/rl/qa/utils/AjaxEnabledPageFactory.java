package com.rl.qa.utils;

import org.apache.commons.lang3.StringUtils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.pagefactory.AjaxElementLocatorFactory;
import org.openqa.selenium.support.pagefactory.ElementLocatorFactory;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class AjaxEnabledPageFactory extends PageFactory {
    static Method instantiatePageMethod = null;

    static {
        Method[] methods = PageFactory.class.getDeclaredMethods();
        for (Method method : methods) {
            if (StringUtils.equals(method.getName(), "instantiatePage")) {
                instantiatePageMethod = method;
                instantiatePageMethod.setAccessible(true);
            }
        }
    }

    public static <T> T ajaxInitElements(WebDriver driver, Class pageClassToProxy) {
        T page = instantiatePage(driver, pageClassToProxy);
        initElements(driver, page);
        return page;
    }

    public static void initElements(WebDriver driver, Object page) {
        final WebDriver driverRef = driver;
        initElements(new AjaxElementLocatorFactory(driverRef, 10), page);
    }
    public static void initElements(ElementLocatorFactory factory, Object page) {
        final ElementLocatorFactory factoryRef = factory;
        initElements(new StaleReferenceAwareFieldDecorator(factoryRef, 3), page);
    }

    protected static <T> T instantiatePage(WebDriver driver,
                                           Class pageClassToProxy) {
        try {
            return (T) instantiatePageMethod.invoke(
                    AjaxEnabledPageFactory.class, driver, pageClassToProxy);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        }
        return null;
    }
}
