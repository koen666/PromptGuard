import mysql from "mysql2/promise";
import { getMysqlConfig } from "../config.js";

const TABLES = [
  `CREATE TABLE IF NOT EXISTS prompts (
    id VARCHAR(160) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description LONGTEXT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'draft',
    active_version_id VARCHAR(160) NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_prompts_updated_at (updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS prompt_versions (
    id VARCHAR(160) PRIMARY KEY,
    prompt_id VARCHAR(160) NOT NULL,
    version_number INT NOT NULL,
    content LONGTEXT NOT NULL,
    changelog LONGTEXT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'versioned',
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_prompt_versions_prompt (prompt_id),
    CONSTRAINT fk_prompt_versions_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(160) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id VARCHAR(160) NOT NULL,
    tag_id VARCHAR(160) NOT NULL,
    PRIMARY KEY (prompt_id, tag_id),
    INDEX idx_prompt_tags_tag (tag_id),
    CONSTRAINT fk_prompt_tags_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_prompt_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(160) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    failed_login_count INT NOT NULL DEFAULT 0,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(160) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(160) NOT NULL,
    role_id VARCHAR(160) NOT NULL,
    PRIMARY KEY (user_id, role_id),
    INDEX idx_user_roles_role (role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(160) PRIMARY KEY,
    user_id VARCHAR(160) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    expires_at VARCHAR(40) NOT NULL,
    revoked_at VARCHAR(40) NULL,
    INDEX idx_sessions_user (user_id),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS system_config (
    \`key\` VARCHAR(255) PRIMARY KEY,
    value LONGTEXT NOT NULL,
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS model_config (
    id VARCHAR(160) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    model VARCHAR(255) NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_model_config_provider (provider)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS alert_rules (
    id VARCHAR(160) PRIMARY KEY,
    metric VARCHAR(255) NOT NULL,
    operator VARCHAR(4) NOT NULL,
    threshold DOUBLE NOT NULL,
    severity VARCHAR(64) NOT NULL DEFAULT 'medium',
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS alert_records (
    id VARCHAR(160) PRIMARY KEY,
    rule_id VARCHAR(160) NULL,
    release_id VARCHAR(160) NULL,
    metric VARCHAR(255) NOT NULL,
    value DOUBLE NOT NULL,
    threshold DOUBLE NOT NULL,
    severity VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'open',
    message LONGTEXT NOT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_alert_records_status (status),
    CONSTRAINT fk_alert_records_rule FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS metric_samples (
    id VARCHAR(160) PRIMARY KEY,
    release_id VARCHAR(160) NULL,
    prompt_id VARCHAR(160) NOT NULL,
    environment VARCHAR(255) NOT NULL DEFAULT 'production',
    metric VARCHAR(255) NOT NULL,
    value DOUBLE NOT NULL,
    unit VARCHAR(255) NULL,
    sampled_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_metric_samples_release (release_id),
    INDEX idx_metric_samples_prompt (prompt_id),
    CONSTRAINT fk_metric_samples_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(160) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS test_cases (
    id VARCHAR(160) PRIMARY KEY,
    dataset_id VARCHAR(160) NOT NULL,
    input LONGTEXT NOT NULL,
    expected_behavior LONGTEXT NULL,
    tags LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_test_cases_dataset (dataset_id),
    CONSTRAINT fk_test_cases_dataset FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS evaluation_runs (
    id VARCHAR(160) PRIMARY KEY,
    prompt_version_id VARCHAR(160) NOT NULL,
    dataset_id VARCHAR(160) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    models LONGTEXT NOT NULL,
    provider VARCHAR(255) NOT NULL DEFAULT 'mock',
    avg_score DOUBLE NULL,
    total_tokens INT NOT NULL DEFAULT 0,
    total_cost DOUBLE NOT NULL DEFAULT 0,
    error_message LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    completed_at VARCHAR(40) NULL,
    INDEX idx_evaluation_runs_version (prompt_version_id),
    INDEX idx_evaluation_runs_dataset (dataset_id),
    CONSTRAINT fk_evaluation_runs_version FOREIGN KEY (prompt_version_id) REFERENCES prompt_versions(id),
    CONSTRAINT fk_evaluation_runs_dataset FOREIGN KEY (dataset_id) REFERENCES datasets(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS evaluation_results (
    id VARCHAR(160) PRIMARY KEY,
    run_id VARCHAR(160) NOT NULL,
    test_case_id VARCHAR(160) NOT NULL,
    model VARCHAR(255) NOT NULL,
    output LONGTEXT NOT NULL,
    relevance_score DOUBLE NOT NULL,
    format_score DOUBLE NOT NULL,
    latency_ms INT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    cost DOUBLE NOT NULL DEFAULT 0,
    error_message LONGTEXT NULL,
    passed TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_evaluation_results_run (run_id),
    INDEX idx_evaluation_results_case (test_case_id),
    CONSTRAINT fk_evaluation_results_run FOREIGN KEY (run_id) REFERENCES evaluation_runs(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_results_case FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS evaluation_comparisons (
    id VARCHAR(160) PRIMARY KEY,
    prompt_id VARCHAR(160) NOT NULL,
    baseline_version_id VARCHAR(160) NOT NULL,
    candidate_version_id VARCHAR(160) NOT NULL,
    dataset_id VARCHAR(160) NOT NULL,
    baseline_run_id VARCHAR(160) NOT NULL,
    candidate_run_id VARCHAR(160) NOT NULL,
    avg_score_delta DOUBLE NOT NULL,
    pass_rate_delta DOUBLE NOT NULL,
    latency_delta_ms DOUBLE NOT NULL,
    improved_count INT NOT NULL,
    regressed_count INT NOT NULL,
    unchanged_count INT NOT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_evaluation_comparisons_prompt (prompt_id),
    CONSTRAINT fk_evaluation_comparisons_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_comparisons_dataset FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    CONSTRAINT fk_evaluation_comparisons_baseline_run FOREIGN KEY (baseline_run_id) REFERENCES evaluation_runs(id),
    CONSTRAINT fk_evaluation_comparisons_candidate_run FOREIGN KEY (candidate_run_id) REFERENCES evaluation_runs(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS security_scans (
    id VARCHAR(160) PRIMARY KEY,
    prompt_version_id VARCHAR(160) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    provider VARCHAR(255) NOT NULL DEFAULT 'mock',
    risk_score DOUBLE NULL,
    passed TINYINT(1) NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    completed_at VARCHAR(40) NULL,
    INDEX idx_security_scans_version (prompt_version_id),
    CONSTRAINT fk_security_scans_version FOREIGN KEY (prompt_version_id) REFERENCES prompt_versions(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS security_findings (
    id VARCHAR(160) PRIMARY KEY,
    scan_id VARCHAR(160) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    attack_input LONGTEXT NOT NULL,
    model_output LONGTEXT NOT NULL,
    risk_level VARCHAR(64) NOT NULL,
    description LONGTEXT NOT NULL,
    recommendation LONGTEXT NULL,
    passed TINYINT(1) NOT NULL,
    INDEX idx_security_findings_scan (scan_id),
    CONSTRAINT fk_security_findings_scan FOREIGN KEY (scan_id) REFERENCES security_scans(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS prompt_optimizations (
    id VARCHAR(160) PRIMARY KEY,
    scan_id VARCHAR(160) NOT NULL,
    prompt_id VARCHAR(160) NOT NULL,
    source_version_id VARCHAR(160) NOT NULL,
    candidate_version_id VARCHAR(160) NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'draft',
    provider VARCHAR(255) NOT NULL DEFAULT 'mock',
    model VARCHAR(255) NOT NULL DEFAULT 'promptguard-review',
    summary LONGTEXT NOT NULL,
    overall_risk_level VARCHAR(64) NOT NULL,
    overall_risk_score DOUBLE NOT NULL,
    leak_probability DOUBLE NOT NULL,
    review_json LONGTEXT NOT NULL,
    optimized_prompt LONGTEXT NOT NULL,
    created_by VARCHAR(255) NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    applied_at VARCHAR(40) NULL,
    INDEX idx_prompt_optimizations_scan (scan_id),
    INDEX idx_prompt_optimizations_prompt (prompt_id),
    CONSTRAINT fk_prompt_optimizations_scan FOREIGN KEY (scan_id) REFERENCES security_scans(id) ON DELETE CASCADE,
    CONSTRAINT fk_prompt_optimizations_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS review_requests (
    id VARCHAR(160) PRIMARY KEY,
    prompt_id VARCHAR(160) NOT NULL,
    prompt_version_id VARCHAR(160) NOT NULL,
    evaluation_run_id VARCHAR(160) NULL,
    security_scan_id VARCHAR(160) NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    submitted_by VARCHAR(255) NULL,
    reviewed_by VARCHAR(255) NULL,
    comment LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    reviewed_at VARCHAR(40) NULL,
    INDEX idx_review_requests_prompt (prompt_id),
    INDEX idx_review_requests_version (prompt_version_id),
    CONSTRAINT fk_review_requests_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_requests_version FOREIGN KEY (prompt_version_id) REFERENCES prompt_versions(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS gray_releases (
    id VARCHAR(160) PRIMARY KEY,
    prompt_id VARCHAR(160) NOT NULL,
    prompt_version_id VARCHAR(160) NOT NULL,
    traffic_percent INT NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    note LONGTEXT NULL,
    observation_score DOUBLE NULL,
    observation_latency_ms INT NULL,
    observation_cost DOUBLE NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    ended_at VARCHAR(40) NULL,
    INDEX idx_gray_releases_prompt (prompt_id),
    INDEX idx_gray_releases_version (prompt_version_id),
    CONSTRAINT fk_gray_releases_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_gray_releases_version FOREIGN KEY (prompt_version_id) REFERENCES prompt_versions(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS route_policies (
    id VARCHAR(160) PRIMARY KEY,
    prompt_id VARCHAR(160) NOT NULL,
    environment VARCHAR(255) NOT NULL DEFAULT 'production',
    stable_version_id VARCHAR(160) NULL,
    gray_version_id VARCHAR(160) NULL,
    traffic_percent INT NOT NULL DEFAULT 0,
    status VARCHAR(64) NOT NULL DEFAULT 'idle',
    updated_by VARCHAR(255) NULL,
    note LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    UNIQUE KEY idx_route_policies_prompt_environment (prompt_id, environment),
    CONSTRAINT fk_route_policies_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS release_events (
    id VARCHAR(160) PRIMARY KEY,
    prompt_id VARCHAR(160) NOT NULL,
    prompt_version_id VARCHAR(160) NULL,
    event_type VARCHAR(64) NOT NULL,
    detail LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_release_events_prompt (prompt_id),
    CONSTRAINT fk_release_events_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(160) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    actor VARCHAR(255) NULL,
    detail LONGTEXT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_audit_logs_entity (entity_type, entity_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS report_records (
    id VARCHAR(160) PRIMARY KEY,
    type VARCHAR(64) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    format VARCHAR(64) NOT NULL,
    file_path LONGTEXT NOT NULL,
    generated_by VARCHAR(255) NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_report_records_source (source_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS promptguard_projects (
    id VARCHAR(160) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    config_json LONGTEXT NOT NULL,
    created_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS promptguard_prompt_assets (
    project_id VARCHAR(160) NOT NULL,
    prompt_id VARCHAR(160) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active_version_number INT NOT NULL,
    status VARCHAR(64) NOT NULL,
    tags_json LONGTEXT NOT NULL,
    content LONGTEXT NOT NULL,
    metadata_json LONGTEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    updated_at VARCHAR(40) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    PRIMARY KEY (project_id, name),
    INDEX idx_promptguard_prompt_assets_prompt_id (prompt_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export async function runMigrations() {
  const config = getMysqlConfig();
  const server = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: false,
  });

  const databaseName = mysqlIdentifier(config.database, "database");
  await server.execute(`CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await server.query(`USE ${databaseName}`);

  for (const statement of TABLES) {
    await server.execute(statement);
  }

  await server.end();
  console.log(`Migrations complete: mysql://${config.user}@${config.host}:${config.port}/${config.database}`);
}

function mysqlIdentifier(value: string, label: string) {
  if (!/^[A-Za-z0-9_$]+$/.test(value)) {
    throw new Error(`Invalid MySQL ${label} name: ${value}`);
  }
  return `\`${value}\``;
}
