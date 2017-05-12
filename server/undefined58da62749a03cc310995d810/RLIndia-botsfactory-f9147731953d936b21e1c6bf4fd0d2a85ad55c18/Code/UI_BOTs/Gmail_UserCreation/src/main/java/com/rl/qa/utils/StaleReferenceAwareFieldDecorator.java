package com.rl.qa.utils;

import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.internal.WrapsElement;
import org.openqa.selenium.support.pagefactory.DefaultFieldDecorator;
import org.openqa.selenium.support.pagefactory.ElementLocator;
import org.openqa.selenium.support.pagefactory.ElementLocatorFactory;
import org.openqa.selenium.support.pagefactory.internal.LocatingElementHandler;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Decorates {@link org.openqa.selenium.WebElement} to try to avoid throwing
 * {@link org.openqa.selenium.StaleElementReferenceException}. When the exception is thrown, the mechanism tries to
 * locate element again.
 *
 * @author <a href="mailto:jpapouse@redhat.com">Jan Papousek</a>
 *
 * @see <a href="http://www.brimllc.com/2011/01/extending-selenium-2-0-webdriver-to-support-ajax">Extending Selenium 2.0
 * WebDriver to Support AJAX</a>
 */
public class StaleReferenceAwareFieldDecorator extends DefaultFieldDecorator {
    private final int numberOfTries;
    /**
     * Creates a new instance of the decorator
     *
     * @param factory
     * locator factory
     * @param numberOfTries
     * number of tries to locate element
     */
    public StaleReferenceAwareFieldDecorator(ElementLocatorFactory factory, int numberOfTries) {
        super(factory);
        this.numberOfTries = numberOfTries;
    }

    @Override
    protected WebElement proxyForLocator(ClassLoader loader, ElementLocator locator) {
        InvocationHandler handler = new StaleReferenceAwareElementLocator(locator);
        WebElement proxy = (WebElement) Proxy.newProxyInstance(loader, new Class[] { WebElement.class,
                WrapsElement.class }, handler);
        return proxy;
    }

    private class StaleReferenceAwareElementLocator extends LocatingElementHandler {
        private final ElementLocator locator;
        public StaleReferenceAwareElementLocator(ElementLocator locator) {
            super(locator);
            this.locator = locator;
        }
        public Object invoke(Object object, Method method, Object[] objects) throws Throwable {
            WebElement element = null;
            for (int i = 0; i < numberOfTries; i++) {
                element = locator.findElement();
                if ("getWrappedElement".equals(method.getName())) {
                    return element;
                }
                try {
                    return invokeMethod(method, element, objects);
                } catch (StaleElementReferenceException ignored) {
                }
            }
            throw new RuntimeException("Cannot invoke " + method.getName() + " on element " + element
                    + ". Cannot find it");
        }
        private Object invokeMethod(Method method, WebElement element, Object[] objects) throws Throwable {
            try {
                return method.invoke(element, objects);
            } catch (InvocationTargetException e) {
                throw e.getCause();
            } catch (IllegalArgumentException e) {
                throw e.getCause();
            } catch (IllegalAccessException e) {
                throw e.getCause();
            }
        }
    }
}