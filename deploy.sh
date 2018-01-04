#!/bin/bash

########
# Workaround script that moves the contents of '_site' to the 'master' branch. This is needed
# until polyglot is whitelisted by GitHub pages.
#
# Requires that the site is built in '_site'.
#######

# Move the built site.
rm -rf /tmp/_site
mv _site /tmp || exit 1

# Change branches.
git checkout master || exit 2

# Remove everything but '.' and '.git*'.
find . -maxdepth 1 | grep -v "^\.$" | grep -v "^\./\.git" | xargs rm -rf

# Copy the site back.
mv /tmp/_site/* .

