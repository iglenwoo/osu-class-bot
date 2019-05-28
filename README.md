Class Beaver
==================

This is an Slack app that provides class information and professor rating data in convenient ways.

Introduction
------------

Students often want to know not only the information of OSU classes, but also how lecturers of the classes are.

[Rate My Professors](https://www.ratemyprofessors.com) is a website for professor ratings based on students. Students frequently visit this website as well as [OSU Class website](class.oregonstate.edu) when they search classes.

But, switching the two websites and copying names pasting them into one another is annoying.

OSU Class Finder minimizes the effort by following `Slack commands`.  

Slack Commands
--------

`class` shows the professor's rating data of the class.
```text
/class {major_code}{class_number}
e.g. /class cs553
```

`prof' shows the professor's rating data.
```text
/prof {any combination of OSU professor's name}
e.g. /prof firstname
     /prof lastname
     /prof firstname lastname

```