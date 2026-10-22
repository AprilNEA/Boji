//! End-to-end tests: load a `locales/` tree, validate it and render the outputs.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};

use boji_locales::apple::{self, XcodeCheck};
use boji_locales::{Catalog, Change, LoadError, Outputs, Problem};

/// A temporary repository root, removed on drop.
struct Fixture {
    root: PathBuf,
}

impl Fixture {
    fn new(files: &[(&str, &str)]) -> Self {
        static NEXT: AtomicUsize = AtomicUsize::new(0);
        let root = std::env::temp_dir().join(format!(
            "boji-locales-test-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        let fixture = Self { root };
        for (path, contents) in files {
            fixture.write(path, contents);
        }
        fixture
    }

    fn write(&self, path: &str, contents: &str) {
        let full = self.root.join(path);
        fs::create_dir_all(full.parent().expect("fixture paths have a parent"))
            .expect("create fixture directory");
        fs::write(full, contents).expect("write fixture file");
    }

    fn read(&self, path: &str) -> String {
        fs::read_to_string(self.root.join(path)).expect("read generated file")
    }

    fn exists(&self, path: &str) -> bool {
        self.root.join(path).exists()
    }

    fn root(&self) -> &Path {
        &self.root
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        // A leftover temporary directory does not affect other tests.
        let _cleanup = fs::remove_dir_all(&self.root);
    }
}

const CONFIG: &str = "\
source: zh-Hans
fallback: zh-Hans
release: [zh-Hans, en]
targets: [android, ios]
";

const META: &str = "\
tab_today:
rest_seconds:
  comment: Countdown between two sets.
  args:
    seconds: int
    exercise: string
android_only:
  targets: [android]
ios_only:
  targets: [ios]
";

const ZH: &str = "\
tab_today: \"今天\"
rest_seconds: \"{seconds, plural, other {休息 # 秒，下一个：{exercise}}}\"
android_only: \"返回\"
ios_only: \"完成 100%\"
";

const EN: &str = "\
tab_today: \"Today\"
rest_seconds: \"{seconds, plural, one {Rest # second, next: {exercise}} other {Rest # seconds, next: {exercise}}}\"
android_only: \"Back\"
ios_only: \"100% done\"
";

fn valid_fixture() -> Fixture {
    Fixture::new(&[
        ("locales/locales.yaml", CONFIG),
        ("locales/meta/common.yaml", META),
        ("locales/zh-Hans/common.yaml", ZH),
        ("locales/en/common.yaml", EN),
    ])
}

fn problems(fixture: &Fixture) -> Vec<String> {
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let problems: Vec<Problem> = catalog.validate().expect_err("fixture has problems");
    problems.iter().map(ToString::to_string).collect()
}

fn assert_problem(problems: &[String], expected: &str) {
    assert!(
        problems.iter().any(|problem| problem.contains(expected)),
        "no problem contains {expected:?}; problems: {problems:#?}"
    );
}

#[test]
fn renders_android_resources_per_language() {
    let fixture = valid_fixture();
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let validated = catalog.validate().expect("fixture is valid");
    let outputs = Outputs::render(&validated, fixture.root()).expect("render");
    outputs.apply(fixture.root()).expect("write outputs");

    let zh = fixture.read("android/app/src/main/res/values/strings_shared.xml");
    assert!(zh.contains("<string name=\"locale_tag\">zh-Hans</string>"));
    assert!(zh.contains("<string name=\"tab_today\">今天</string>"));
    assert!(zh.contains("<item quantity=\"other\">休息 %1$d 秒，下一个：%2$s</item>"));
    assert!(zh.contains("<string name=\"android_only\">返回</string>"));
    assert!(!zh.contains("ios_only"));
    assert!(!zh.contains("quantity=\"one\""));

    let en = fixture.read("android/app/src/main/res/values-en/strings_shared.xml");
    assert!(en.contains("<string name=\"locale_tag\">en</string>"));
    assert!(en.contains(
        "    <plurals name=\"rest_seconds\">\n\
         \x20       <item quantity=\"one\">Rest %1$d second, next: %2$s</item>\n\
         \x20       <item quantity=\"other\">Rest %1$d seconds, next: %2$s</item>\n\
         \x20   </plurals>\n"
    ));
}

#[test]
fn renders_one_string_catalog_with_named_placeholders() {
    let fixture = valid_fixture();
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let validated = catalog.validate().expect("fixture is valid");
    let rendered = apple::render(&validated);

    assert!(rendered.contains("\"sourceLanguage\" : \"zh-Hans\""));
    assert!(rendered.contains("\"comment\" : \"Countdown between two sets.\""));
    assert!(rendered.contains("\"extractionState\" : \"manual\""));
    assert!(rendered.contains("Rest %1$(seconds)lld second, next: %2$(exercise)@"));
    // `%` stays single when a string has no arguments.
    assert!(rendered.contains("\"value\" : \"100% done\""));
    assert!(!rendered.contains("android_only"));

    match apple::compile(&rendered).expect("xcstringstool accepts the catalog") {
        XcodeCheck::Compiled | XcodeCheck::Skipped(_) => {}
    }
}

#[test]
fn a_second_run_changes_nothing() {
    let fixture = valid_fixture();
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let validated = catalog.validate().expect("fixture is valid");
    let outputs = Outputs::render(&validated, fixture.root()).expect("render");
    assert_eq!(outputs.apply(fixture.root()).expect("first run").len(), 3);
    assert!(outputs.changes(fixture.root()).expect("compare").is_empty());
}

#[test]
fn deletes_files_of_languages_that_leave_the_release() {
    let fixture = valid_fixture();
    {
        let catalog = Catalog::load(fixture.root()).expect("fixture loads");
        let validated = catalog.validate().expect("fixture is valid");
        let outputs = Outputs::render(&validated, fixture.root()).expect("render");
        outputs.apply(fixture.root()).expect("write outputs");
    }
    let en = "android/app/src/main/res/values-en/strings_shared.xml";
    assert!(fixture.exists(en));

    fixture.write(
        "locales/locales.yaml",
        "source: zh-Hans\nfallback: zh-Hans\nrelease: [zh-Hans]\ntargets: [android]\n",
    );
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let validated = catalog.validate().expect("fixture is valid");
    let outputs = Outputs::render(&validated, fixture.root()).expect("render");
    let changes = outputs.apply(fixture.root()).expect("write outputs");

    assert!(changes.contains(&Change::Delete(PathBuf::from(en))));
    assert!(changes.contains(&Change::Delete(PathBuf::from(apple::PATH))));
    assert!(!fixture.exists(en));
    assert!(!fixture.exists(apple::PATH));
}

#[test]
fn reports_every_broken_rule() {
    let fixture = Fixture::new(&[
        ("locales/locales.yaml", CONFIG),
        (
            "locales/meta/common.yaml",
            "\
tab_today:
rest_seconds:
  args:
    exercise: string
    seconds: int
greeting:
  args:
    name: string
",
        ),
        ("locales/meta/other.yaml", "tab_today:\n"),
        (
            "locales/zh-Hans/common.yaml",
            "\
tab_today: \"今天\"
rest_seconds: \"{seconds, plural, other {休息 # 秒，{exercise}}}\"
greeting: \"你好，{nmae}\"
",
        ),
        ("locales/zh-Hans/other.yaml", "tab_today: \"今天\"\n"),
        (
            "locales/en/common.yaml",
            "\
rest_seconds: \"{seconds, plural, other {Rest # seconds, {exercise}}}\"
greeting: \"Hello,  {name}\"
",
        ),
        (
            "locales/fr/common.yaml",
            "tab_today: \"{jour, select, other {x}}\"\n",
        ),
    ]);
    let problems = problems(&fixture);

    assert_problem(
        &problems,
        "locales/meta/other.yaml: tab_today: is also declared in locales/meta/common.yaml",
    );
    assert_problem(
        &problems,
        "locales/zh-Hans/common.yaml: greeting: does not use the argument `name`",
    );
    assert_problem(
        &problems,
        "greeting: uses the argument `nmae`, which locales/meta/common.yaml does not declare",
    );
    assert_problem(
        &problems,
        "rest_seconds: the plural argument `seconds` must be the first argument",
    );
    assert_problem(
        &problems,
        "locales/en/common.yaml: rest_seconds: needs the plural categories `one` of `en`",
    );
    assert_problem(
        &problems,
        "locales/en/common.yaml: tab_today: is missing; a release language needs every key",
    );
    assert_problem(
        &problems,
        "locales/en/common.yaml: greeting: has leading, trailing or repeated spaces",
    );
    assert_problem(
        &problems,
        "locales/fr/common.yaml: tab_today: cannot parse the message at character 7: argument type `select` is not supported",
    );
}

#[test]
fn every_language_agrees_on_the_plural() {
    let fixture = Fixture::new(&[
        (
            "locales/locales.yaml",
            "source: zh-Hans\nfallback: zh-Hans\nrelease: [zh-Hans, en]\ntargets: [android]\n",
        ),
        (
            "locales/meta/common.yaml",
            "minutes:\n  args:\n    count: int\n",
        ),
        ("locales/zh-Hans/common.yaml", "minutes: \"{count} 分钟\"\n"),
        (
            "locales/en/common.yaml",
            "minutes: \"{count, plural, one {# minute} other {# minutes}}\"\n",
        ),
    ]);
    assert_problem(
        &problems(&fixture),
        "locales/en/common.yaml: minutes: must use no plural argument, like the source language",
    );
}

#[test]
fn checks_the_release_configuration() {
    let fixture = Fixture::new(&[
        (
            "locales/locales.yaml",
            "source: zh-Hans\nfallback: en\nrelease: [zh-Hans, ja]\ntargets: [android]\n",
        ),
        ("locales/meta/common.yaml", "tab_today:\n"),
        ("locales/zh-Hans/common.yaml", "tab_today: \"今天\"\n"),
    ]);
    let problems = problems(&fixture);
    assert_problem(
        &problems,
        "`release` must include the fallback language `en`",
    );
    assert_problem(&problems, "`ja` has no directory locales/ja/");
}

#[test]
fn rejects_non_canonical_language_directories() {
    let fixture = Fixture::new(&[
        ("locales/locales.yaml", CONFIG),
        ("locales/meta/common.yaml", "tab_today:\n"),
        ("locales/zh-hans/common.yaml", "tab_today: \"今天\"\n"),
    ]);
    let error = Catalog::load(fixture.root()).expect_err("non-canonical directory");
    assert!(matches!(error, LoadError::Locale { .. }));
    assert_eq!(
        error.to_string(),
        "locales/zh-hans: write `zh-Hans`, not `zh-hans`"
    );
}

#[test]
fn rejects_unknown_metadata_fields() {
    let fixture = Fixture::new(&[
        ("locales/locales.yaml", CONFIG),
        ("locales/meta/common.yaml", "tab_today:\n  coment: typo\n"),
    ]);
    let error = Catalog::load(fixture.root()).expect_err("unknown field");
    assert!(
        error.to_string().contains("unknown field `coment`"),
        "{error}"
    );
}

#[test]
fn reserves_the_locale_tag_key() {
    let fixture = Fixture::new(&[
        ("locales/locales.yaml", CONFIG),
        ("locales/meta/common.yaml", "locale_tag:\n"),
        ("locales/zh-Hans/common.yaml", "locale_tag: \"zh-Hans\"\n"),
        ("locales/en/common.yaml", "locale_tag: \"en\"\n"),
    ]);
    assert_problem(
        &problems(&fixture),
        "locales/meta/common.yaml: locale_tag: is reserved, because the generator writes it to every Android file",
    );
}

const WALLET_CONFIG: &str = "\
source: zh-Hans
fallback: en
release: [en, zh-Hans]
targets: [android, ios, wallet]
";

const WALLET_PATH: &str = "bizserver/src/wallet/strings.rs";

#[test]
fn renders_the_wallet_table_with_the_fallback_language_first() {
    let fixture = Fixture::new(&[
        ("locales/locales.yaml", WALLET_CONFIG),
        (
            "locales/meta/wallet.yaml",
            "wallet_label_nickname:\n  comment: |\n    Label of the nickname.\n\n    Shown on the front.\n  targets: [wallet]\n",
        ),
        ("locales/meta/common.yaml", "tab_today:\n"),
        (
            "locales/zh-Hans/wallet.yaml",
            "wallet_label_nickname: \"昵称\"\n",
        ),
        ("locales/zh-Hans/common.yaml", "tab_today: \"今天\"\n"),
        (
            "locales/en/wallet.yaml",
            "wallet_label_nickname: \"Nick \\\"name\\\"\"\n",
        ),
        ("locales/en/common.yaml", "tab_today: \"Today\"\n"),
    ]);
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let validated = catalog.validate().expect("fixture is valid");
    let outputs = Outputs::render(&validated, fixture.root()).expect("render");
    outputs.apply(fixture.root()).expect("write outputs");

    let table = fixture.read(WALLET_PATH);
    assert!(table.contains("pub(crate) const LANGUAGES: [&str; 2] = [\"en\", \"zh-Hans\"];"));
    assert!(table.contains(
        "/// `wallet_label_nickname`: Label of the nickname.\n\
         ///\n\
         /// Shown on the front.\n\
         pub(crate) const WALLET_LABEL_NICKNAME: Text = Text {\n\
         \x20   values: [\n\
         \x20       \"Nick \\\"name\\\"\",\n\
         \x20       \"昵称\",\n\
         \x20   ],\n\
         };\n"
    ));
    assert!(
        table.contains("pub(crate) const ALL: [&Text; 1] = [\n    &WALLET_LABEL_NICKNAME,\n];\n")
    );
    // A key without `targets` goes to both apps and not to the pass.
    assert!(!table.contains("TAB_TODAY"));
    assert!(fixture.read(apple::PATH).contains("tab_today"));
    assert!(!fixture.read(apple::PATH).contains("wallet_label_nickname"));
    let android = fixture.read("android/app/src/main/res/values/strings_shared.xml");
    assert!(android.contains("tab_today") && !android.contains("wallet_label_nickname"));

    fixture.write(
        "locales/locales.yaml",
        "source: zh-Hans\nfallback: en\nrelease: [en, zh-Hans]\ntargets: [android, ios]\n",
    );
    let catalog = Catalog::load(fixture.root()).expect("fixture loads");
    let validated = catalog.validate().expect("fixture is valid");
    let outputs = Outputs::render(&validated, fixture.root()).expect("render");
    let changes = outputs.apply(fixture.root()).expect("write outputs");
    assert!(changes.contains(&Change::Delete(PathBuf::from(WALLET_PATH))));
}

#[test]
fn wallet_keys_hold_unique_literal_text() {
    let fixture = Fixture::new(&[
        ("locales/locales.yaml", WALLET_CONFIG),
        (
            "locales/meta/wallet.yaml",
            "\
wallet_title:
  targets: [wallet]
wallet_heading:
  targets: [wallet]
wallet_greeting:
  args:
    name: string
  targets: [wallet]
wallet_blank:
  targets: [wallet]
",
        ),
        (
            "locales/zh-Hans/wallet.yaml",
            "wallet_title: \"会员卡\"\nwallet_heading: \"会员卡片\"\nwallet_greeting: \"你好，{name}\"\nwallet_blank: \"空\"\n",
        ),
        (
            "locales/en/wallet.yaml",
            "wallet_title: \"Card\"\nwallet_heading: \"Card\"\nwallet_greeting: \"Hello, {name}\"\nwallet_blank: \" \"\n",
        ),
    ]);
    let problems = problems(&fixture);
    assert_problem(
        &problems,
        "locales/en/wallet.yaml: wallet_heading: has the same `en` text as `wallet_title`",
    );
    assert_problem(
        &problems,
        "locales/meta/wallet.yaml: wallet_greeting: declares arguments, but the wallet target takes literal text only",
    );
    assert_problem(
        &problems,
        "locales/en/wallet.yaml: wallet_blank: is empty; the pass uses the fallback text as the localization key",
    );
}
