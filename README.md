# Cookbook Randomizer

A small static site that randomly chooses a cookbook from a Google Sheet and then chooses a valid page from that cookbook's configured page ranges.

It is already configured for this Google Sheet:

https://docs.google.com/document/d/1P5HcJNq12RrXVGTHrkzH6oyccuwTMYWcWwoBWFHurg4

## Expected Google Sheet format

The first row should contain headers:

| Book Name | Page Ranges |
| --- | --- |
| Mythical Cookbook | 72-250 |
| Brunch at Bobby's | 67-143; 183-195 |
| The Food Lab | 191-401; 503-915 |

Multiple ranges are separated by semicolons. Pages outside those ranges are never selected.

## Behavior

- **Reroll Book + Page** picks a different cookbook when possible, then chooses a page from that book.
- **Reroll Page** keeps the current cookbook and chooses another valid page when possible.
- Every cookbook has equal odds of being selected.
- Within a cookbook, every valid page has equal odds of being selected, including books with multiple page ranges.
