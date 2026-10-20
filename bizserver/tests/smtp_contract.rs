//! SMTP relay delivery against a minimal local SMTP server.
//!
//! The server listens on a loopback port and records one session. The tests
//! need no external relay and no database.

use better_auth::email::EmailProvider;
use boji_bizserver::mail::{MailTransport, Mailer, SmtpRelay, SmtpSecurity};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::TcpListener,
    sync::oneshot,
};

/// The commands and the message data of one SMTP session.
struct Session {
    commands: Vec<String>,
    data: String,
}

/// Accept one connection and answer it like a relay.
///
/// `reject_recipient` answers `RCPT TO` with a permanent failure.
async fn relay(reject_recipient: bool) -> (u16, oneshot::Receiver<Session>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind relay");
    let port = listener.local_addr().expect("relay address").port();
    let (sender, receiver) = oneshot::channel();
    tokio::spawn(async move {
        let (stream, _) = listener.accept().await.expect("accept client");
        let (read, mut write) = stream.into_split();
        let mut lines = BufReader::new(read);
        write.write_all(b"220 relay.test ESMTP\r\n").await.unwrap();
        let mut commands = Vec::new();
        let mut data = String::new();
        let mut in_data = false;
        let mut sender = Some(sender);
        loop {
            let mut line = String::new();
            if lines.read_line(&mut line).await.unwrap_or(0) == 0 {
                break;
            }
            if in_data {
                if line == ".\r\n" {
                    in_data = false;
                    write.write_all(b"250 2.0.0 queued\r\n").await.unwrap();
                    if let Some(sender) = sender.take() {
                        let _ = sender.send(Session {
                            commands: std::mem::take(&mut commands),
                            data: std::mem::take(&mut data),
                        });
                    }
                } else {
                    data.push_str(&line);
                }
                continue;
            }
            let command = line.trim_end().to_owned();
            let upper = command.to_ascii_uppercase();
            commands.push(command);
            let reply: &[u8] = if upper.starts_with("EHLO") {
                b"250-relay.test\r\n250 8BITMIME\r\n"
            } else if upper.starts_with("RCPT TO") && reject_recipient {
                b"550 5.1.1 mailbox unavailable\r\n"
            } else if upper.starts_with("MAIL FROM")
                || upper.starts_with("RCPT TO")
                || upper.starts_with("RSET")
                || upper.starts_with("NOOP")
            {
                b"250 2.0.0 ok\r\n"
            } else if upper == "DATA" {
                in_data = true;
                b"354 end with .\r\n"
            } else if upper == "QUIT" {
                write.write_all(b"221 2.0.0 bye\r\n").await.unwrap();
                break;
            } else {
                b"502 5.5.2 not implemented\r\n"
            };
            write.write_all(reply).await.unwrap();
        }
        if let Some(sender) = sender.take() {
            let _ = sender.send(Session { commands, data });
        }
    });
    (port, receiver)
}

fn mailer(port: u16) -> Mailer {
    Mailer::new(MailTransport::Smtp(SmtpRelay {
        host: "127.0.0.1".to_owned(),
        port,
        security: SmtpSecurity::None,
        credentials: None,
        from: "Boji <no-reply@example.test>"
            .parse()
            .expect("from mailbox"),
    }))
    .expect("SMTP transport")
}

#[tokio::test]
async fn delivers_a_multipart_message_through_the_relay() {
    let (port, session) = relay(false).await;
    mailer(port)
        .send(
            "member@example.test",
            "Boji test",
            "<p>html body</p>",
            "plain body",
        )
        .await
        .expect("delivery");
    let session = session.await.expect("relay session");
    assert!(
        session
            .commands
            .iter()
            .any(|command| command == "MAIL FROM:<no-reply@example.test>"),
        "{:?}",
        session.commands
    );
    assert!(
        session
            .commands
            .iter()
            .any(|command| command == "RCPT TO:<member@example.test>"),
        "{:?}",
        session.commands
    );
    let data = session.data;
    assert!(
        data.contains("From: Boji <no-reply@example.test>\r\n"),
        "{data}"
    );
    assert!(data.contains("To: member@example.test\r\n"), "{data}");
    assert!(data.contains("Subject: Boji test\r\n"), "{data}");
    assert!(data.contains("multipart/alternative"), "{data}");
    assert!(data.contains("plain body"), "{data}");
    assert!(data.contains("<p>html body</p>"), "{data}");
}

#[tokio::test]
async fn a_rejected_recipient_fails_the_delivery() {
    let (port, _session) = relay(true).await;
    let result = mailer(port)
        .send("missing@example.test", "Boji test", "<p>x</p>", "x")
        .await;
    assert!(result.is_err());
}

#[tokio::test]
async fn an_unreachable_relay_fails_the_delivery() {
    // Bind and release a port, so nothing listens on it.
    let port = {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        listener.local_addr().expect("address").port()
    };
    let result = mailer(port)
        .send("member@example.test", "Boji test", "<p>x</p>", "x")
        .await;
    assert!(result.is_err());
}

#[tokio::test]
async fn an_invalid_recipient_fails_before_connecting() {
    let (port, _session) = relay(false).await;
    let result = mailer(port)
        .send("not an address", "Boji test", "<p>x</p>", "x")
        .await;
    assert!(result.is_err());
}
