#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Execute como root." >&2
  exit 1
fi

install -d -m 755 /etc/ssh/sshd_config.d
printf '%s\n' \
  'PermitRootLogin no' \
  'PasswordAuthentication no' \
  'KbdInteractiveAuthentication no' \
  'PubkeyAuthentication yes' \
  > /etc/ssh/sshd_config.d/00-ecomed-hardening.conf
chmod 600 /etc/ssh/sshd_config.d/00-ecomed-hardening.conf
rm -f /etc/ssh/sshd_config.d/99-ecomed-hardening.conf

passwd -l root >/dev/null
sshd -t

if command -v systemctl >/dev/null 2>&1 && systemctl reload ssh; then
  :
elif command -v service >/dev/null 2>&1 && service ssh reload; then
  :
else
  echo "Configuração validada; recarregue o sshd no namespace do host." >&2
fi

echo "SSH_HARDENED"
