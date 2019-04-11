OSU Class Finder
==================

This is an Slack app that provides class information and student's professor ratings in convenient ways.

Introduction
------------

Students often want to know not only the information of OSU classes, but also how lecturers of the classes are.

[Rate My Professors](https://www.ratemyprofessors.com) is a website for professor ratings based on students. Students frequently visit this website as well as [OSU Class website](class.oregonstate.edu) when they search classes.

But, switching the two websites and copying names pasting them into one another is annoying.

OSU Class Finder minimizes the effort by following `Slack commands`.  

Slack Commands
--------

`rate` shows the professor's rating of the class.
```text
/rate {{major_code}{class_number} | '{professor_name}'} ({year_season} {term(wt,sp,sm,f)})
e.g. /rate cs553 2019 sp
     /rate cs553
     /rate 'alan turing'
```
