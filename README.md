OSU Class Bot
==================

This is an Slack chat bot APIs that provides class information and professor evaluation.

Introduction
------------

Class information on class.oregonstate.edu and professor evaluation on ratemyprofessor.com is provided to users.

Users can simply send slash commands on the OSU Class bot.

Commands
--------

`class` shows class information and professor evaluation on ratemyprofessor.com
```text
/class {major_code} {class_number} {year_season:optional}
```

`eval` shows the professor evaluation data on ratemyprofessor.com
```text
/eval {professor_name}
```