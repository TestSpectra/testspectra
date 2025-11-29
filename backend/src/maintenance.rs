use std::time::Duration;

use sqlx::PgPool;

/// Start background maintenance job for execution_order rebalancing.
///
/// This will run once on startup and then every 9 hours.
pub fn start_execution_order_maintenance(db: PgPool) {
    tokio::spawn(async move {
        // Run once on startup
        match rebalance_execution_order_once(&db).await {
            Ok(count) => {
                tracing::info!(
                    "Initial execution_order rebalance completed, updated {} rows",
                    count
                );
            }
            Err(e) => {
                tracing::error!("Initial execution_order rebalance failed: {}", e);
            }
        }

        // Then run every 9 hours
        loop {
            tokio::time::sleep(Duration::from_secs(9 * 60 * 60)).await;
            match rebalance_execution_order_once(&db).await {
                Ok(count) => {
                    tracing::info!(
                        "Scheduled execution_order rebalance completed, updated {} rows",
                        count
                    );
                }
                Err(e) => {
                    tracing::error!("Scheduled execution_order rebalance failed: {}", e);
                }
            }
        }
    });
}

/// Perform a single execution_order rebalance pass.
/// Returns the number of rows updated.
pub async fn rebalance_execution_order_once(db: &PgPool) -> Result<i64, sqlx::Error> {
    let result = sqlx::query(
        r#"
        WITH ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY execution_order ASC, created_at ASC, case_id ASC) AS rn
            FROM test_cases
        )
        UPDATE test_cases t
        SET execution_order = ordered.rn::double precision,
            updated_at = NOW()
        FROM ordered
        WHERE t.id = ordered.id
        "#,
    )
    .execute(db)
    .await?;

    Ok(result.rows_affected() as i64)
}
