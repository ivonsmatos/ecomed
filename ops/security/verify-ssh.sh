#!/bin/sh
set -eu

sshd -T 2>/dev/null |
  grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication) '
passwd -S root | awk '{print "root_password_status=" $2}'
