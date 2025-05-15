/* kernel_mechanisms.c */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/proc_fs.h>
#include <linux/seq_file.h>
#include <linux/interrupt.h>
#include <linux/workqueue.h>
#include <linux/timer.h>
#include <linux/jiffies.h>
#include <linux/delay.h>        /* for udelay() */
#include <linux/random.h>
#include "kernel_mechanisms.h"

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Claude");
MODULE_DESCRIPTION("Demo: softirq (HI tasklet), tasklet, and workqueue");

static struct mechanism_stats softirq_stats;
static struct mechanism_stats tasklet_stats;
static struct mechanism_stats workqueue_stats;

static struct workqueue_struct *demo_wq;
static struct work_struct demo_work;

/* ——— SOFTIRQ TASKLET (runs at HI_SOFTIRQ) ——— */
static void softirq_tasklet_fn(struct tasklet_struct *t)
{
    ktime_t start = ktime_get(), end;
    unsigned long ns;

    udelay(50);
    end = ktime_get();

    ns = ktime_to_ns(ktime_sub(end, start));
    update_stats(&softirq_stats, ns);
}
DECLARE_TASKLET(softirq_tasklet, softirq_tasklet_fn);

/* ——— NORMAL TASKLET (runs at TASKLET_SOFTIRQ) ——— */
static void normal_tasklet_fn(struct tasklet_struct *t)
{
     ktime_t start = ktime_get(), end;
     unsigned long ns;
     unsigned int r;
     get_random_bytes(&r, sizeof(r));
     udelay(50 + (r % 200));
     end = ktime_get();
     ns = ktime_to_ns(ktime_sub(end, start));
     update_stats(&tasklet_stats, ns);
 }

DECLARE_TASKLET(normal_tasklet, normal_tasklet_fn);

/* ——— WORKQUEUE HANDLER ——— */
static void demo_work_fn(struct work_struct *w)
{
    ktime_t start = ktime_get(), end;
    unsigned long ns;

    udelay(200);
    end = ktime_get();

    ns = ktime_to_ns(ktime_sub(end, start));
    update_stats(&workqueue_stats, ns);
}

/* ——— TIMER CB: schedule all three ——— */
static struct timer_list demo_timer;
static void demo_timer_cb(struct timer_list *t)
{
    /* HI‑SOFTIRQ */
    tasklet_hi_schedule(&softirq_tasklet);

    /* normal tasklet */
    tasklet_schedule(&normal_tasklet);

    /* workqueue */
    queue_work(demo_wq, &demo_work);

    /* re-arm */
    mod_timer(&demo_timer, jiffies + msecs_to_jiffies(DELAY_MS));
}

/* ——— /proc SHOW ——— */
static int proc_show(struct seq_file *m, void *v)
{
    unsigned long sa=0, ta=0, wa=0;

    if (softirq_stats.calls)  sa = softirq_stats.total_latency_ns  / softirq_stats.calls;
    if (tasklet_stats.calls)  ta = tasklet_stats.total_latency_ns  / tasklet_stats.calls;
    if (workqueue_stats.calls) wa = workqueue_stats.total_latency_ns / workqueue_stats.calls;

    seq_printf(m,
        "{\n"
        "  \"softirq\":   {\"calls\": %lu, \"avg_ns\": %lu, \"min_ns\": %lu, \"max_ns\": %lu},\n"
        "  \"tasklet\":   {\"calls\": %lu, \"avg_ns\": %lu, \"min_ns\": %lu, \"max_ns\": %lu},\n"
        "  \"workqueue\": {\"calls\": %lu, \"avg_ns\": %lu, \"min_ns\": %lu, \"max_ns\": %lu}\n"
        "}\n",
        softirq_stats.calls,  sa, softirq_stats.min_latency_ns,  softirq_stats.max_latency_ns,
        tasklet_stats.calls,  ta, tasklet_stats.min_latency_ns,  tasklet_stats.max_latency_ns,
        workqueue_stats.calls, wa, workqueue_stats.min_latency_ns, workqueue_stats.max_latency_ns
    );
    return 0;
}

static int proc_open_cb(struct inode *inode, struct file *file)
{
    return single_open(file, proc_show, NULL);
}

static const struct proc_ops proc_fops = {
    .proc_open    = proc_open_cb,
    .proc_read    = seq_read,
    .proc_lseek   = seq_lseek,
    .proc_release = single_release,
};

/* ——— INIT & EXIT ——— */
static int __init kernel_mechanisms_init(void)
{
    /* zero stats */
    memset(&softirq_stats,   0, sizeof(softirq_stats));
    memset(&tasklet_stats,   0, sizeof(tasklet_stats));
    memset(&workqueue_stats, 0, sizeof(workqueue_stats));

    /* procfs entry */
    if (!proc_create(PROC_NAME, 0644, NULL, &proc_fops)) {
        pr_err("km_mech: failed to create /proc/%s\n", PROC_NAME);
        return -ENOMEM;
    }

    /* workqueue */
    demo_wq = create_singlethread_workqueue("demo_wq");
    if (!demo_wq) {
        remove_proc_entry(PROC_NAME, NULL);
        pr_err("km_mech: create_singlethread_workqueue failed\n");
        return -ENOMEM;
    }
    INIT_WORK(&demo_work, demo_work_fn);

    /* timer */
    timer_setup(&demo_timer, demo_timer_cb, 0);
    mod_timer(&demo_timer, jiffies + msecs_to_jiffies(DELAY_MS));

    pr_info("km_mech loaded\n");
    return 0;
}

static void __exit kernel_mechanisms_exit(void)
{
    del_timer_sync(&demo_timer);

    tasklet_kill(&softirq_tasklet);
    tasklet_kill(&normal_tasklet);

    cancel_work_sync(&demo_work);
    destroy_workqueue(demo_wq);

    remove_proc_entry(PROC_NAME, NULL);

    pr_info("km_mech unloaded\n");
}

module_init(kernel_mechanisms_init);
module_exit(kernel_mechanisms_exit);
