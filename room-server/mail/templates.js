function message(subject, lines, url, button) {
  const text = `${lines.join('\n\n')}\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.\n\nToonwide`
  const html =
    `<p>${lines.join('</p><p>')}</p>` +
    `<p><a href="${url}" style="background:#4f8cff;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${button}</a></p>` +
    `<p style="color:#6b7280">If you didn't ask for this, you can ignore this email.</p><p>Toonwide</p>`
  return { subject, text, html }
}

export function verifyEmailMessage(url) {
  return message('Verify your Toonwide account', ['Welcome to Toonwide!', 'Confirm your email to activate your account and get your free minutes. The link is valid for 24 hours.'], url, 'Verify email')
}

export function resetEmailMessage(url) {
  return message('Reset your Toonwide password', ['Someone asked to reset the password for your Toonwide account.', 'The link is valid for 1 hour.'], url, 'Choose a new password')
}

export function existingAccountMessage(loginUrl) {
  return message('You already have a Toonwide account', ['Someone tried to sign up with this email, but you already have an account.', 'Log in instead, or reset your password from the login page.'], loginUrl, 'Log in')
}
