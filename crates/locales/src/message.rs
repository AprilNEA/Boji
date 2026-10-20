//! A parser for the subset of ICU MessageFormat that `locales/` allows.
//!
//! A message is text with `{name}` arguments and at most one plural argument:
//! `{count, plural, one {# item} other {# items}}`. Inside a plural branch, `#`
//! stands for the count. Apostrophes follow the ICU rules: `''` is one apostrophe,
//! and an apostrophe before `{`, `}` or, inside a branch, `#` starts quoted text.
//!
//! The parser rejects the rest of ICU, such as `select`, `number`, `=0` selectors,
//! `offset` and nested plurals. Both platforms can express the accepted subset
//! with their own resources.

use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::str::FromStr;

use crate::model::{ArgName, PluralCategory};

/// A parsed message of one language.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Message {
    nodes: Vec<Node>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Node {
    Segment(Segment),
    Plural(Plural),
}

/// A plural argument and its branches.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Plural {
    arg: ArgName,
    branches: BTreeMap<PluralCategory, Vec<Segment>>,
}

impl Plural {
    /// Returns the argument that selects the branch.
    pub fn arg(&self) -> &ArgName {
        &self.arg
    }

    /// Returns the categories that the message defines.
    pub fn categories(&self) -> BTreeSet<PluralCategory> {
        self.branches.keys().copied().collect()
    }
}

/// A piece of rendered text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Segment {
    /// Literal text, already unquoted.
    Text(String),
    /// The value of an argument.
    Arg(ArgName),
    /// `#` in a plural branch: the value of the plural argument.
    Count(ArgName),
}

/// The text forms of a message, ready for a renderer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Forms {
    /// A message without a plural argument.
    Single(Vec<Segment>),
    /// A message with a plural argument: one complete form per category. Text
    /// outside the plural argument is copied into every form.
    Plural {
        /// The argument that selects the form.
        arg: ArgName,
        /// The forms, in CLDR category order.
        forms: BTreeMap<PluralCategory, Vec<Segment>>,
    },
}

impl Message {
    /// Returns the plural argument, if the message has one.
    pub fn plural(&self) -> Option<&Plural> {
        self.nodes.iter().find_map(|node| match node {
            Node::Plural(plural) => Some(plural),
            Node::Segment(_) => None,
        })
    }

    /// Returns every argument that the message uses, including the plural argument.
    pub fn arguments(&self) -> BTreeSet<&ArgName> {
        let mut names = BTreeSet::new();
        for node in &self.nodes {
            match node {
                Node::Segment(Segment::Arg(name)) => {
                    names.insert(name);
                }
                Node::Segment(_) => {}
                Node::Plural(plural) => {
                    names.insert(&plural.arg);
                    for segment in plural.branches.values().flatten() {
                        if let Segment::Arg(name) = segment {
                            names.insert(name);
                        }
                    }
                }
            }
        }
        names
    }

    /// Expands the message into complete text forms.
    pub fn forms(&self) -> Forms {
        let Some(plural) = self.plural() else {
            let segments = self.nodes.iter().filter_map(|node| match node {
                Node::Segment(segment) => Some(segment.clone()),
                Node::Plural(_) => None,
            });
            return Forms::Single(merge_text(segments));
        };
        let forms = plural
            .branches
            .iter()
            .map(|(category, branch)| {
                let segments = self.nodes.iter().flat_map(|node| match node {
                    Node::Segment(segment) => std::slice::from_ref(segment).iter(),
                    Node::Plural(_) => branch.iter(),
                });
                (*category, merge_text(segments.cloned()))
            })
            .collect();
        Forms::Plural {
            arg: plural.arg.clone(),
            forms,
        }
    }
}

impl FromStr for Message {
    type Err = ParseError;

    fn from_str(text: &str) -> Result<Self, Self::Err> {
        Parser::new(text).parse_message()
    }
}

fn merge_text(segments: impl IntoIterator<Item = Segment>) -> Vec<Segment> {
    let mut merged: Vec<Segment> = Vec::new();
    for segment in segments {
        match (merged.last_mut(), segment) {
            (_, Segment::Text(text)) if text.is_empty() => {}
            (Some(Segment::Text(last)), Segment::Text(text)) => last.push_str(&text),
            (_, segment) => merged.push(segment),
        }
    }
    merged
}

/// The error for a message outside the accepted subset.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("at character {offset}: {kind}")]
pub struct ParseError {
    /// The zero-based character offset of the problem.
    pub offset: usize,
    /// What is wrong.
    pub kind: ParseErrorKind,
}

/// The kinds of [`ParseError`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseErrorKind {
    /// A `{` without a matching `}`.
    UnclosedBrace,
    /// A `}` outside an argument.
    UnexpectedCloseBrace,
    /// Quoted text that does not end.
    UnclosedQuote,
    /// An argument name that breaks the naming rule.
    InvalidArgName(String),
    /// An argument type other than `plural`.
    UnsupportedArgumentType(String),
    /// A comma was expected.
    ExpectedComma,
    /// A `{` that starts a plural branch was expected.
    ExpectedBranch,
    /// A plural selector that is not a CLDR category name.
    InvalidSelector(String),
    /// A plural category that appears twice.
    DuplicateCategory(PluralCategory),
    /// A plural argument without an `other` branch.
    MissingOther,
    /// A plural argument inside a plural branch.
    NestedPlural,
    /// A second plural argument in one message.
    MultiplePlurals,
}

impl fmt::Display for ParseErrorKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnclosedBrace => f.write_str("`{` has no matching `}`"),
            Self::UnexpectedCloseBrace => {
                f.write_str("`}` closes nothing; write `'}'` for a literal brace")
            }
            Self::UnclosedQuote => f.write_str("quoted text does not end with `'`"),
            Self::InvalidArgName(name) => write!(
                f,
                "invalid argument name `{name}`: use lower camel case, such as `activeDays`"
            ),
            Self::UnsupportedArgumentType(kind) => write!(
                f,
                "argument type `{kind}` is not supported; use `{{name}}` or `{{name, plural, ...}}`"
            ),
            Self::ExpectedComma => f.write_str("expected `,`"),
            Self::ExpectedBranch => f.write_str("expected `{` to start a plural branch"),
            Self::InvalidSelector(selector) => write!(
                f,
                "plural selector `{selector}` is not supported; use zero, one, two, few, many or other"
            ),
            Self::DuplicateCategory(category) => {
                write!(f, "plural category `{category}` appears twice")
            }
            Self::MissingOther => f.write_str("a plural argument needs an `other` branch"),
            Self::NestedPlural => f.write_str("plural arguments cannot be nested"),
            Self::MultiplePlurals => {
                f.write_str("a message can have only one plural argument; split the message")
            }
        }
    }
}

struct Parser {
    chars: Vec<char>,
    pos: usize,
}

impl Parser {
    fn new(text: &str) -> Self {
        Self {
            chars: text.chars().collect(),
            pos: 0,
        }
    }

    fn error(&self, kind: ParseErrorKind) -> ParseError {
        ParseError {
            offset: self.pos,
            kind,
        }
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }

    fn peek_next(&self) -> Option<char> {
        self.chars.get(self.pos + 1).copied()
    }

    fn skip_whitespace(&mut self) {
        while self.peek().is_some_and(char::is_whitespace) {
            self.pos += 1;
        }
    }

    fn word(&mut self) -> String {
        let start = self.pos;
        while self
            .peek()
            .is_some_and(|c| !c.is_whitespace() && !matches!(c, ',' | '{' | '}'))
        {
            self.pos += 1;
        }
        self.chars[start..self.pos].iter().collect()
    }

    fn expect(&mut self, expected: char, kind: ParseErrorKind) -> Result<(), ParseError> {
        if self.peek() == Some(expected) {
            self.pos += 1;
            Ok(())
        } else {
            Err(self.error(kind))
        }
    }

    fn parse_message(mut self) -> Result<Message, ParseError> {
        let mut nodes = Vec::new();
        let mut text = String::new();
        while let Some(c) = self.peek() {
            match c {
                '{' => {
                    flush(&mut text, &mut nodes);
                    let start = self.pos;
                    let node = self.parse_argument(None)?;
                    if matches!(node, Node::Plural(_))
                        && nodes.iter().any(|n| matches!(n, Node::Plural(_)))
                    {
                        self.pos = start;
                        return Err(self.error(ParseErrorKind::MultiplePlurals));
                    }
                    nodes.push(node);
                }
                '}' => return Err(self.error(ParseErrorKind::UnexpectedCloseBrace)),
                '\'' => self.parse_apostrophe(&mut text, false)?,
                _ => {
                    text.push(c);
                    self.pos += 1;
                }
            }
        }
        flush(&mut text, &mut nodes);
        Ok(Message { nodes })
    }

    /// Parses an argument that starts at `{`. `branch_of` is the plural argument
    /// when the parser is inside one of its branches.
    fn parse_argument(&mut self, branch_of: Option<&ArgName>) -> Result<Node, ParseError> {
        let open = self.pos;
        self.pos += 1;
        self.skip_whitespace();
        let name_start = self.pos;
        let raw = self.word();
        let name = ArgName::try_from(raw.clone()).map_err(|_| ParseError {
            offset: name_start,
            kind: ParseErrorKind::InvalidArgName(raw),
        })?;
        self.skip_whitespace();
        match self.peek() {
            Some('}') => {
                self.pos += 1;
                Ok(Node::Segment(Segment::Arg(name)))
            }
            Some(',') => {
                self.pos += 1;
                self.skip_whitespace();
                let kind_start = self.pos;
                let kind = self.word();
                if kind != "plural" {
                    self.pos = kind_start;
                    return Err(self.error(ParseErrorKind::UnsupportedArgumentType(kind)));
                }
                if branch_of.is_some() {
                    self.pos = open;
                    return Err(self.error(ParseErrorKind::NestedPlural));
                }
                self.skip_whitespace();
                self.expect(',', ParseErrorKind::ExpectedComma)?;
                self.parse_branches(open, name).map(Node::Plural)
            }
            Some(_) => Err(self.error(ParseErrorKind::ExpectedComma)),
            None => Err(ParseError {
                offset: open,
                kind: ParseErrorKind::UnclosedBrace,
            }),
        }
    }

    fn parse_branches(&mut self, open: usize, arg: ArgName) -> Result<Plural, ParseError> {
        let mut branches = BTreeMap::new();
        loop {
            self.skip_whitespace();
            match self.peek() {
                Some('}') => {
                    self.pos += 1;
                    break;
                }
                None => {
                    return Err(ParseError {
                        offset: open,
                        kind: ParseErrorKind::UnclosedBrace,
                    });
                }
                Some(_) => {}
            }
            let selector_start = self.pos;
            let selector = self.word();
            let category = PluralCategory::from_cldr(&selector).ok_or_else(|| ParseError {
                offset: selector_start,
                kind: ParseErrorKind::InvalidSelector(selector.clone()),
            })?;
            self.skip_whitespace();
            if self.peek() != Some('{') {
                return Err(self.error(ParseErrorKind::ExpectedBranch));
            }
            let branch = self.parse_branch(&arg)?;
            if branches.insert(category, branch).is_some() {
                return Err(ParseError {
                    offset: selector_start,
                    kind: ParseErrorKind::DuplicateCategory(category),
                });
            }
        }
        if !branches.contains_key(&PluralCategory::Other) {
            return Err(ParseError {
                offset: open,
                kind: ParseErrorKind::MissingOther,
            });
        }
        Ok(Plural { arg, branches })
    }

    /// Parses a branch that starts at `{` and returns its segments.
    fn parse_branch(&mut self, arg: &ArgName) -> Result<Vec<Segment>, ParseError> {
        let open = self.pos;
        self.pos += 1;
        let mut segments = Vec::new();
        let mut text = String::new();
        loop {
            let Some(c) = self.peek() else {
                return Err(ParseError {
                    offset: open,
                    kind: ParseErrorKind::UnclosedBrace,
                });
            };
            match c {
                '}' => {
                    self.pos += 1;
                    break;
                }
                '{' => {
                    push_text(&mut text, &mut segments);
                    match self.parse_argument(Some(arg))? {
                        Node::Segment(segment) => segments.push(segment),
                        Node::Plural(_) => {
                            unreachable!("parse_argument rejects plurals inside a branch")
                        }
                    }
                }
                '#' => {
                    push_text(&mut text, &mut segments);
                    segments.push(Segment::Count(arg.clone()));
                    self.pos += 1;
                }
                '\'' => self.parse_apostrophe(&mut text, true)?,
                _ => {
                    text.push(c);
                    self.pos += 1;
                }
            }
        }
        push_text(&mut text, &mut segments);
        Ok(segments)
    }

    /// Parses an apostrophe at the current position and appends the literal text.
    fn parse_apostrophe(&mut self, text: &mut String, in_branch: bool) -> Result<(), ParseError> {
        let start = self.pos;
        match self.peek_next() {
            Some('\'') => {
                text.push('\'');
                self.pos += 2;
            }
            Some('{' | '}') => self.parse_quoted(text, start)?,
            Some('#') if in_branch => self.parse_quoted(text, start)?,
            _ => {
                text.push('\'');
                self.pos += 1;
            }
        }
        Ok(())
    }

    fn parse_quoted(&mut self, text: &mut String, start: usize) -> Result<(), ParseError> {
        self.pos += 1;
        loop {
            match self.peek() {
                None => {
                    return Err(ParseError {
                        offset: start,
                        kind: ParseErrorKind::UnclosedQuote,
                    });
                }
                Some('\'') if self.peek_next() == Some('\'') => {
                    text.push('\'');
                    self.pos += 2;
                }
                Some('\'') => {
                    self.pos += 1;
                    return Ok(());
                }
                Some(c) => {
                    text.push(c);
                    self.pos += 1;
                }
            }
        }
    }
}

fn flush(text: &mut String, nodes: &mut Vec<Node>) {
    if !text.is_empty() {
        nodes.push(Node::Segment(Segment::Text(std::mem::take(text))));
    }
}

fn push_text(text: &mut String, segments: &mut Vec<Segment>) {
    if !text.is_empty() {
        segments.push(Segment::Text(std::mem::take(text)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn arg(name: &str) -> ArgName {
        ArgName::try_from(name.to_owned()).expect("valid test name")
    }

    fn text(value: &str) -> Segment {
        Segment::Text(value.to_owned())
    }

    fn parse(text: &str) -> Message {
        text.parse().expect("valid test message")
    }

    fn error(text: &str) -> ParseError {
        text.parse::<Message>().expect_err("invalid test message")
    }

    #[test]
    fn parses_text_and_arguments() {
        let message = parse("{minutes} 分钟 · { level }");
        assert_eq!(
            message.forms(),
            Forms::Single(vec![
                Segment::Arg(arg("minutes")),
                text(" 分钟 · "),
                Segment::Arg(arg("level")),
            ])
        );
        assert_eq!(message.arguments().len(), 2);
        assert!(message.plural().is_none());
    }

    #[test]
    fn expands_plural_with_surrounding_text() {
        let message = parse("剩余 {seconds, plural, one {# second} other {# seconds}}。");
        let Forms::Plural { arg: name, forms } = message.forms() else {
            panic!("expected plural forms");
        };
        assert_eq!(name, arg("seconds"));
        assert_eq!(
            forms[&PluralCategory::One],
            vec![
                text("剩余 "),
                Segment::Count(arg("seconds")),
                text(" second。")
            ]
        );
        assert_eq!(forms.len(), 2);
    }

    #[test]
    fn collects_arguments_inside_branches() {
        let message = parse("{n, plural, other {{who} did # things}}");
        let names: Vec<_> = message
            .arguments()
            .into_iter()
            .map(ArgName::as_str)
            .collect();
        assert_eq!(names, ["n", "who"]);
    }

    #[test]
    fn handles_apostrophes() {
        let message = parse("don't '{'braces'}' and ''quotes''");
        assert_eq!(
            message.forms(),
            Forms::Single(vec![text("don't {braces} and 'quotes'")])
        );
        let message = parse("{n, plural, other {'#' is # and it's fine}}");
        let Forms::Plural { forms, .. } = message.forms() else {
            panic!("expected plural forms");
        };
        assert_eq!(
            forms[&PluralCategory::Other],
            vec![
                text("# is "),
                Segment::Count(arg("n")),
                text(" and it's fine")
            ]
        );
    }

    #[test]
    fn treats_pound_as_text_outside_plurals() {
        assert_eq!(parse("#1").forms(), Forms::Single(vec![text("#1")]));
    }

    #[test]
    fn rejects_unsupported_syntax() {
        assert_eq!(
            error("{n, number}").kind,
            ParseErrorKind::UnsupportedArgumentType("number".to_owned())
        );
        assert_eq!(
            error("{n, plural, =0 {none} other {#}}").kind,
            ParseErrorKind::InvalidSelector("=0".to_owned())
        );
        assert_eq!(
            error("{n, plural, offset:1 other {#}}").kind,
            ParseErrorKind::InvalidSelector("offset:1".to_owned())
        );
        assert_eq!(
            error("{n, plural, other {{m, plural, other {#}}}}").kind,
            ParseErrorKind::NestedPlural
        );
        assert_eq!(
            error("{a, plural, other {#}}{b, plural, other {#}}").kind,
            ParseErrorKind::MultiplePlurals
        );
        assert_eq!(
            error("{n, plural, one {#}}").kind,
            ParseErrorKind::MissingOther
        );
        assert_eq!(
            error("{n, plural, one {#} one {#} other {#}}").kind,
            ParseErrorKind::DuplicateCategory(PluralCategory::One)
        );
    }

    #[test]
    fn reports_offsets_of_broken_syntax() {
        assert_eq!(error("ab {name").kind, ParseErrorKind::UnclosedBrace);
        assert_eq!(error("ab {name").offset, 3);
        assert_eq!(error("a } b").offset, 2);
        assert_eq!(
            error("{active_days}").kind,
            ParseErrorKind::InvalidArgName("active_days".to_owned())
        );
        assert_eq!(error("x '{y").kind, ParseErrorKind::UnclosedQuote);
    }
}
