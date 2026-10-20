fn main() -> Result<(), Box<dyn std::error::Error>> {
    connectrpc_build::Config::new()
        .files(&["proto/boji/v1/business.proto"])
        .includes(&["proto/"])
        .include_file("_connectrpc.rs")
        .compile()?;
    Ok(())
}
