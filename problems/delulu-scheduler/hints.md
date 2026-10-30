If the plans were in order of start time, how would you decide whether the next plan overlaps the one before it?
---

Sort the plans by `start`. Now overlaps can only happen between a plan and the **last merged** plan, so you only ever compare against one thing. In JavaScript, compare numbers explicitly in the sort: the default sort compares as strings.
---

Keep a result list. For each plan: if its `start` is `<=` the last merged plan's `end`, extend that plan's end with `max(lastEnd, end)` (the new plan might be completely inside it). Otherwise push the plan as a new entry.
