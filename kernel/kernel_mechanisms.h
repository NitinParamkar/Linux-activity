/* kernel_mechanisms.h */

#ifndef KERNEL_MECHANISMS_H
#define KERNEL_MECHANISMS_H

#include <linux/seq_file.h>
#include <linux/interrupt.h>
#include <linux/workqueue.h>
#include <linux/timer.h>
#include <linux/jiffies.h>
#include <linux/ktime.h>

#define PROC_NAME  "kernel_mechanisms"
#define DELAY_MS   1000   /* milliseconds */

/* Stats for any mechanism */
struct mechanism_stats {
    unsigned long calls;
    unsigned long total_latency_ns;
    unsigned long min_latency_ns;
    unsigned long max_latency_ns;
    ktime_t       last_execution;
};

/* Record one sample */
static void update_stats(struct mechanism_stats *s, unsigned long ns)
{
    s->calls++;
    s->total_latency_ns += ns;
    if (s->min_latency_ns == 0 || ns < s->min_latency_ns)
        s->min_latency_ns = ns;
    if (ns > s->max_latency_ns)
        s->max_latency_ns = ns;
    s->last_execution = ktime_get();
}

#endif /* KERNEL_MECHANISMS_H */
