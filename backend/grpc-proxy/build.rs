fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(false)
        .build_client(true)
        .compile_protos(&["../user-service/proto/user_service.proto"], &["../user-service/proto"])?;
    Ok(())
}
