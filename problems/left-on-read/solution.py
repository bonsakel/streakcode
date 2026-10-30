def leftOnRead(sent, replied):
    answered = set(replied)
    for message_id in sent:
        if message_id not in answered:
            return message_id
    return -1
