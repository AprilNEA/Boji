//! Command-line entry point of `boji-locales`.

use std::path::PathBuf;
use std::process::ExitCode;

use anyhow::{Context as _, Result, bail};
use boji_locales::apple::{self, XcodeCheck};
use boji_locales::{Catalog, Outputs};
use clap::{Parser, Subcommand};

/// Generates the Android and iOS string resources of Boji from locales/.
#[derive(Parser)]
#[command(version)]
struct Cli {
    /// The repository root. Defaults to the nearest directory, from the current
    /// directory upward, that contains locales/locales.yaml.
    #[arg(long, global = true)]
    root: Option<PathBuf>,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Validate locales/ and write the generated files.
    Generate,
    /// Validate locales/ and verify that the generated files are current. Writes nothing.
    Check,
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("error: {error:#}");
            ExitCode::FAILURE
        }
    }
}

fn run(cli: Cli) -> Result<()> {
    let root = match cli.root {
        Some(root) => root,
        None => find_root()?,
    };
    let catalog = Catalog::load(&root)?;
    let validated = match catalog.validate() {
        Ok(validated) => validated,
        Err(problems) => {
            for problem in &problems {
                eprintln!("{problem}");
            }
            bail!("locales/ has {} problems", problems.len());
        }
    };
    let outputs = Outputs::render(&validated, &root)?;

    match cli.command {
        Command::Generate => {
            let changes = outputs.apply(&root)?;
            for change in &changes {
                println!("{change}");
            }
            if changes.is_empty() {
                println!("generated files are up to date");
            }
        }
        Command::Check => {
            let changes = outputs.changes(&root)?;
            if !changes.is_empty() {
                for change in &changes {
                    eprintln!("needs: {change}");
                }
                bail!("generated files are out of date; run `cargo locales generate` in crates/");
            }
            // Compile the iOS catalog even when locales.yaml does not list ios,
            // so the Apple renderer stays correct.
            match apple::compile(&apple::render(&validated))? {
                XcodeCheck::Compiled => println!("xcstringstool compiled the iOS String Catalog"),
                XcodeCheck::Skipped(reason) => {
                    println!("skipped the xcstringstool check: {reason}")
                }
            }
            println!(
                "locales/ is valid: {} keys, {} generated files",
                validated.entries.len(),
                outputs.files().len()
            );
        }
    }
    Ok(())
}

fn find_root() -> Result<PathBuf> {
    let current = std::env::current_dir().context("cannot read the current directory")?;
    current
        .ancestors()
        .find(|dir| dir.join("locales").join("locales.yaml").is_file())
        .map(PathBuf::from)
        .with_context(|| {
            format!(
                "no locales/locales.yaml in {} or its parents; pass --root",
                current.display()
            )
        })
}
