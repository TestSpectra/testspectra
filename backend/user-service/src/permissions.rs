use std::collections::HashMap;

pub const PERMISSION_MANAGE_USERS: &str = "manage_users";
pub const PERMISSION_MANAGE_QA_TEAM: &str = "manage_qa_team";
pub const PERMISSION_FULL_TEST_CASE_ACCESS: &str = "full_test_case_access";
pub const PERMISSION_CREATE_EDIT_TEST_CASES: &str = "create_edit_test_cases";
pub const PERMISSION_EXECUTE_ALL_TESTS: &str = "execute_all_tests";
pub const PERMISSION_EXECUTE_AUTOMATED_TESTS: &str = "execute_automated_tests";
pub const PERMISSION_RECORD_TEST_RESULTS: &str = "record_test_results";
pub const PERMISSION_MANAGE_CONFIGURATIONS: &str = "manage_configurations";
pub const PERMISSION_MANAGE_TEST_CONFIGURATIONS: &str = "manage_test_configurations";
pub const PERMISSION_REVIEW_APPROVE_TEST_CASES: &str = "review_approve_test_cases";
pub const PERMISSION_EXPORT_REPORTS: &str = "export_reports";
pub const PERMISSION_MANAGE_INTEGRATIONS: &str = "manage_integrations";

pub const ROLE_ADMIN: &str = "admin";
pub const ROLE_QA_LEAD: &str = "qa_lead";
pub const ROLE_QA_ENGINEER: &str = "qa_engineer";
pub const ROLE_DEVELOPER: &str = "developer";
pub const ROLE_PRODUCT_MANAGER: &str = "product_manager";
pub const ROLE_UI_UX_DESIGNER: &str = "ui_ux_designer";
pub const ROLE_VIEWER: &str = "viewer";

pub fn get_base_permissions(role: &str) -> Vec<String> {
    let permissions_map = get_role_permissions_map();
    permissions_map
        .get(role)
        .cloned()
        .unwrap_or_else(Vec::new)
}

fn get_role_permissions_map() -> HashMap<&'static str, Vec<String>> {
    let mut map = HashMap::new();

    map.insert(
        ROLE_ADMIN,
        vec![
            PERMISSION_MANAGE_USERS.to_string(),
            PERMISSION_MANAGE_QA_TEAM.to_string(),
            PERMISSION_FULL_TEST_CASE_ACCESS.to_string(),
            PERMISSION_EXECUTE_ALL_TESTS.to_string(),
            PERMISSION_MANAGE_CONFIGURATIONS.to_string(),
            PERMISSION_EXPORT_REPORTS.to_string(),
            PERMISSION_MANAGE_INTEGRATIONS.to_string(),
        ],
    );

    map.insert(
        ROLE_QA_LEAD,
        vec![
            PERMISSION_MANAGE_QA_TEAM.to_string(),
            PERMISSION_FULL_TEST_CASE_ACCESS.to_string(),
            PERMISSION_EXECUTE_ALL_TESTS.to_string(),
            PERMISSION_MANAGE_TEST_CONFIGURATIONS.to_string(),
            PERMISSION_REVIEW_APPROVE_TEST_CASES.to_string(),
            PERMISSION_EXPORT_REPORTS.to_string(),
        ],
    );

    map.insert(
        ROLE_QA_ENGINEER,
        vec![
            PERMISSION_CREATE_EDIT_TEST_CASES.to_string(),
            PERMISSION_EXECUTE_ALL_TESTS.to_string(),
            PERMISSION_RECORD_TEST_RESULTS.to_string(),
        ],
    );

    map.insert(
        ROLE_DEVELOPER,
        vec![
            PERMISSION_EXECUTE_AUTOMATED_TESTS.to_string(),
        ],
    );

    map.insert(
        ROLE_PRODUCT_MANAGER,
        vec![
            PERMISSION_EXPORT_REPORTS.to_string(),
        ],
    );

    map.insert(
        ROLE_UI_UX_DESIGNER,
        vec![
            PERMISSION_FULL_TEST_CASE_ACCESS.to_string(),
            PERMISSION_EXPORT_REPORTS.to_string(),
        ],
    );

    map.insert(ROLE_VIEWER, vec![]);

    map
}

pub fn permission_to_proto(permission: &str) -> i32 {
    match permission {
        PERMISSION_MANAGE_USERS => 1,
        PERMISSION_MANAGE_QA_TEAM => 2,
        PERMISSION_FULL_TEST_CASE_ACCESS => 3,
        PERMISSION_CREATE_EDIT_TEST_CASES => 4,
        PERMISSION_EXECUTE_ALL_TESTS => 5,
        PERMISSION_EXECUTE_AUTOMATED_TESTS => 6,
        PERMISSION_RECORD_TEST_RESULTS => 7,
        PERMISSION_MANAGE_CONFIGURATIONS => 8,
        PERMISSION_MANAGE_TEST_CONFIGURATIONS => 9,
        PERMISSION_REVIEW_APPROVE_TEST_CASES => 10,
        PERMISSION_EXPORT_REPORTS => 11,
        PERMISSION_MANAGE_INTEGRATIONS => 12,
        _ => 0,
    }
}

pub fn proto_to_permission(proto: i32) -> Option<String> {
    match proto {
        1 => Some(PERMISSION_MANAGE_USERS.to_string()),
        2 => Some(PERMISSION_MANAGE_QA_TEAM.to_string()),
        3 => Some(PERMISSION_FULL_TEST_CASE_ACCESS.to_string()),
        4 => Some(PERMISSION_CREATE_EDIT_TEST_CASES.to_string()),
        5 => Some(PERMISSION_EXECUTE_ALL_TESTS.to_string()),
        6 => Some(PERMISSION_EXECUTE_AUTOMATED_TESTS.to_string()),
        7 => Some(PERMISSION_RECORD_TEST_RESULTS.to_string()),
        8 => Some(PERMISSION_MANAGE_CONFIGURATIONS.to_string()),
        9 => Some(PERMISSION_MANAGE_TEST_CONFIGURATIONS.to_string()),
        10 => Some(PERMISSION_REVIEW_APPROVE_TEST_CASES.to_string()),
        11 => Some(PERMISSION_EXPORT_REPORTS.to_string()),
        12 => Some(PERMISSION_MANAGE_INTEGRATIONS.to_string()),
        _ => None,
    }
}

pub fn role_to_proto(role: &str) -> i32 {
    match role {
        ROLE_ADMIN => 1,
        ROLE_QA_LEAD => 2,
        ROLE_QA_ENGINEER => 3,
        ROLE_DEVELOPER => 4,
        ROLE_PRODUCT_MANAGER => 5,
        ROLE_UI_UX_DESIGNER => 6,
        ROLE_VIEWER => 7,
        _ => 0,
    }
}

pub fn proto_to_role(proto: i32) -> Option<String> {
    match proto {
        1 => Some(ROLE_ADMIN.to_string()),
        2 => Some(ROLE_QA_LEAD.to_string()),
        3 => Some(ROLE_QA_ENGINEER.to_string()),
        4 => Some(ROLE_DEVELOPER.to_string()),
        5 => Some(ROLE_PRODUCT_MANAGER.to_string()),
        6 => Some(ROLE_UI_UX_DESIGNER.to_string()),
        7 => Some(ROLE_VIEWER.to_string()),
        _ => None,
    }
}
