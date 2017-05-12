package com.rl.qa.utils;

import java.util.concurrent.*;

public class ThreadPool {
    private static ExecutorService executorService = null;

    private static ExecutorService getExecutorService() {
        if (executorService == null) {
            executorService = Executors.newCachedThreadPool();
        }

        return executorService;
    }

    /**
     * Executes the specified runnable in a thread from a thread pool.
     */
    public static void execute(Runnable command) {
        ExecutorService es = getExecutorService();

        es.execute(command);
    }

    /**
     * Executes the specified runnable in a thread from a thread pool.
     *
     * @returns a handle to the running task
     */
    public static Future<?> submit(Runnable command) {
        ExecutorService es = getExecutorService();

        Future<?> f = es.submit(command);

        return f;
    }

    /**
     * Submits a value-returning task for execution and returns a Future
     * representing the pending results of the task.
     *
     * If you would like to immediately block waiting for a task, you
     * can use constructions of the form
     *
     *     result = exec.submit(aCallable).get();
     *
     * @param task - the task to submit
     *
     * @return a Future representing pending completion of the task
     */
    public static <T> Future<T> submit(Callable<T> task) {
        ExecutorService es = getExecutorService();

        Future<T> f = es.submit(task);

        return f;
    }

    private static ScheduledExecutorService scheduledExecutorService = null;

    private static ScheduledExecutorService createScheduledExecutorService() {
        if (scheduledExecutorService == null) {
            scheduledExecutorService = Executors.newScheduledThreadPool(1);
        }

        return scheduledExecutorService;
    }

    /**
     * Creates and executes a ScheduledFuture that becomes enabled after the given delay.
     *
     * @param callable - the task to execute
     * @param delay    - the time to wait before executing the task
     * @param unit     - the time units of the delay argument
     *
     * @return a Future that can be used to extract result or cancel
     */
    public static <T> ScheduledFuture<T> schedule(
            Callable<T> callable,
            long           delay,
            TimeUnit        unit
    ) {
        return createScheduledExecutorService().schedule(callable, delay, unit);
    }

    /**
     * Creates and executes a one-shot action after waiting for the specified delay.
     *
     * @param command - the task to execute
     * @param delay   - the time to wait before executing the task
     * @param unit    - the time units of the delay argument
     *
     * @return a Future representing pending completion of the task, and whose get()
     *         method will return null upon completion
     */
    public static ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit) {
        return createScheduledExecutorService().schedule(command, delay, unit);
    }

    /**
     * Creates and executes a periodic action that becomes enabled first after the
     * given initial delay, and subsequently with the given period; that is executions
     * will commence after initialDelay then initialDelay+period, then
     * initialDelay + 2 * period, and so on. If any execution of the task encounters
     * an exception, subsequent executions are suppressed. Otherwise, the task will
     * only terminate via cancellation or termination of the executor.
     *
     * @param command      - the task to execute
     * @param initialDelay - the time to wait before the first execution
     * @param period       - the time to wait before subsequent executions without
     *                       concern with the completion of prior executions
     * @param unit         - the time units of the initialDelay and period arguments
     *
     * @return a future representing pending completion of the task, and whose get()
     *         method will throw an exception upon cancellation
     */
    public static ScheduledFuture<?> scheduleAtFixedRate(
            Runnable  command,
            long initialDelay,
            long       period,
            TimeUnit     unit
    ) {
        return createScheduledExecutorService().
                scheduleAtFixedRate(command, initialDelay, period, unit);
    }

    /**
     * Creates and executes a periodic action that becomes enabled first after the
     * given initial delay, and subsequently with the given delay between the termination
     * of one execution and the commencement of the next. If any execution of the task
     * encounters an exception, subsequent executions are suppressed. Otherwise, the
     * task will only terminate via cancellation or termination of the executor.
     *
     * @param command      - the task to execute
     * @param initialDelay - the time to wait before the first execution
     * @param delay        - the time to wait after termination of one execution and
     *                       start of subsequent executions
     * @param unit         - the time units of the initialDelay and delay arguments
     *
     * @return a future representing pending completion of the task, and whose get()
     *         method will throw an exception upon cancellation
     */
    public static ScheduledFuture<?> scheduleWithFixedDelay(
            Runnable  command,
            long initialDelay,
            long        delay,
            TimeUnit     unit
    ) {
        return createScheduledExecutorService().
                scheduleWithFixedDelay(command, initialDelay, delay, unit);
    }
}