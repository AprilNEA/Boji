fn main() -> Result<(), Box<dyn std::error::Error>> {
    connectrpc_build::Config::new()
        .files(&[
            "proto/boji/v1/error_reason.proto",
            "proto/boji/v1/system_service.proto",
            "proto/boji/v1/membership.proto",
            "proto/boji/v1/membership_service.proto",
            "proto/boji/v1/wallet_service.proto",
            "proto/boji/v1/activity_service.proto",
            "proto/boji/admin/v1/entitlement_service.proto",
            "proto/boji/admin/v1/membership_service.proto",
            // Imported googleapis types that appear in messages or error details.
            "third_party/googleapis/google/rpc/status.proto",
            "third_party/googleapis/google/rpc/error_details.proto",
            "third_party/googleapis/google/type/date.proto",
        ])
        .includes(&["proto/", "third_party/googleapis/"])
        .include_file("_connectrpc.rs")
        .compile()?;
    Ok(())
}
