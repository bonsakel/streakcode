function leftOnRead(sent, replied) {
  const answered = new Set(replied);
  for (const id of sent) {
    if (!answered.has(id)) return id;
  }
  return -1;
}
