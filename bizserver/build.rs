//! Generate the protobuf and ConnectRPC code of the Boji API.
//!
//! `buf build` reads the workspace in this directory (`buf.yaml`) and
//! resolves googleapis from `buf.lock`. The first build needs network
//! access, or a buf module cache that already holds that commit. Set `BUF` to
//! use a `buf` binary that is not on `PATH`.

use std::{env, path::PathBuf, process::Command};

/// The files to generate, as names inside the buf workspace.
///
/// `google.rpc` is not listed: `aip_193::proto` provides those types.
const FILES: &[&str] = &[
    "boji/v1/error_reason.proto",
    "boji/v1/system_service.proto",
    "boji/v1/membership.proto",
    "boji/v1/membership_service.proto",
    "boji/v1/wallet_service.proto",
    "boji/v1/activity_service.proto",
    "boji/v1/organization.proto",
    "boji/v1/organization_service.proto",
    "boji/v1/affiliation.proto",
    "boji/v1/affiliation_service.proto",
    "boji/admin/v1/entitlement_service.proto",
    "boji/admin/v1/membership_service.proto",
    "boji/admin/v1/organization_service.proto",
    // The googleapis types that appear in Boji messages.
    "google/type/date.proto",
    "google/type/localized_text.proto",
];

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let workspace = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);
    let descriptor_set = PathBuf::from(env::var("OUT_DIR")?).join("boji.binpb");

    let buf = env::var_os("BUF").unwrap_or_else(|| "buf".into());
    let status = Command::new(&buf)
        .arg("build")
        .arg(&workspace)
        .arg("--as-file-descriptor-set")
        .arg("-o")
        .arg(&descriptor_set)
        .status()
        .map_err(|error| format!("cannot run {buf:?}: {error}. Install buf or set BUF."))?;
    if !status.success() {
        return Err(format!("`buf build` failed: {status}").into());
    }

    let mut buffa = connectrpc_build::CodeGenConfig::default();
    buffa.extern_paths.push((
        ".google.rpc".to_owned(),
        "::aip_193::proto::google::rpc".to_owned(),
    ));
    connectrpc_build::Config::new()
        // `buffa_config` replaces the whole config, so turn JSON support and
        // the type registration functions back on after it.
        .buffa_config(buffa)
        .generate_json(true)
        .descriptor_set(&descriptor_set)
        .files(FILES)
        .include_file("_connectrpc.rs")
        // The descriptor set is written on every run. A `rerun-if-changed` on
        // it would rerun this script on every build, so list the real inputs.
        .emit_rerun_directives(false)
        .compile()?;

    println!("cargo:rerun-if-changed=proto");
    println!("cargo:rerun-if-changed=buf.yaml");
    println!("cargo:rerun-if-changed=buf.lock");
    println!("cargo:rerun-if-env-changed=BUF");
    Ok(())
}
