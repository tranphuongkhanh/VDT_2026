-- =================================================================================
-- NHÓM 1: CƠ CẤU TỔ CHỨC & NGƯỜI DÙNG
-- =================================================================================

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT NULL,
    level INT NOT NULL DEFAULT 0,
    path VARCHAR(1000) NULL,
    manager_id BIGINT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES departments(id)
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department_id BIGINT,
    manager_id BIGINT NULL,
    employee_code VARCHAR(50) UNIQUE NULL,
    position VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Cập nhật khóa ngoại cho departments sau khi đã có bảng users
ALTER TABLE departments 
ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES users(id);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    granted_by BIGINT,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- =================================================================================
-- NHÓM 2: CẤU HÌNH LOẠI YÊU CẦU & BIỂU MẪU
-- =================================================================================

CREATE TABLE request_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(100) NULL,
    category VARCHAR(50) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forms (
    id BIGSERIAL PRIMARY KEY,
    request_type_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    schema_data JSONB NOT NULL, 
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_type_id) REFERENCES request_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =================================================================================
-- NHÓM 3: CẤU HÌNH & XỬ LÝ WORKFLOW
-- =================================================================================

CREATE TABLE workflows (
    id BIGSERIAL PRIMARY KEY,
    request_type_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_type_id) REFERENCES request_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE workflow_steps (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    step_order INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    approver_type VARCHAR(30) NOT NULL,
    approver_ref_id BIGINT NULL,
    action_on_approve VARCHAR(100) NOT NULL,
    action_on_reject VARCHAR(100) NOT NULL,
    is_parallel BOOLEAN DEFAULT FALSE,
    parallel_threshold INT DEFAULT 1 CHECK(parallel_threshold >= 1),
    time_limit_hours INT NULL,
    notify_on_enter BOOLEAN DEFAULT TRUE,
    description TEXT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- =================================================================================
-- NHÓM 4: XỬ LÝ YÊU CẦU & THÔNG BÁO
-- =================================================================================

CREATE TABLE requests (
    id BIGSERIAL PRIMARY KEY,
    request_no VARCHAR(50) UNIQUE NOT NULL,
    request_type_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    workflow_id BIGINT NOT NULL,
    form_id BIGINT NOT NULL,
    current_step INT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    form_data JSONB NOT NULL,
    title VARCHAR(500) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    submitted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    due_date DATE NULL,
    note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_type_id) REFERENCES request_types(id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    FOREIGN KEY (form_id) REFERENCES forms(id)
);

CREATE TABLE delegations (
    id BIGSERIAL PRIMARY KEY,
    delegator_id BIGINT NOT NULL,
    delegate_to_id BIGINT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'ALL',
    request_type_ids JSONB NULL,
    reason TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_date CHECK (to_date >= from_date),
    CONSTRAINT uq_active_delegation UNIQUE (delegator_id, is_active),
    FOREIGN KEY (delegator_id) REFERENCES users(id),
    FOREIGN KEY (delegate_to_id) REFERENCES users(id)
);

CREATE TABLE request_approvals (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    workflow_step_id BIGINT NOT NULL,
    approver_id BIGINT NOT NULL,
    action VARCHAR(30) NOT NULL,
    comment TEXT NULL,
    acted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delegate_to BIGINT NULL,
    delegated_from BIGINT NULL,
    delegation_id BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (workflow_step_id) REFERENCES workflow_steps(id),
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (delegate_to) REFERENCES users(id),
    FOREIGN KEY (delegated_from) REFERENCES users(id),
    FOREIGN KEY (delegation_id) REFERENCES delegations(id),
    CONSTRAINT uq_request_step_approver UNIQUE(request_id, workflow_step_id, approver_id)
);

CREATE TABLE request_logs (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    actor_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    step_from INT NULL,
    step_to INT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    storage_key VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    request_id BIGINT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    channel VARCHAR(20) DEFAULT 'IN_APP',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (request_id) REFERENCES requests(id)
);

-- =================================================================================
-- INDEX VÀ RÀNG BUỘC ĐẶC BIỆT CỦA POSTGRESQL
-- =================================================================================

-- Indexes thường
CREATE INDEX idx_requests_requester ON requests(requester_id, status, submitted_at DESC);
CREATE INDEX idx_requests_status_step ON requests(status, current_step);
CREATE INDEX idx_requests_due_date ON requests(due_date, status);
CREATE INDEX idx_approvals_approver ON request_approvals(approver_id, acted_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_dept_parent ON departments(parent_id);
CREATE INDEX idx_workflow_type_active ON workflows(request_type_id, is_active);
CREATE INDEX idx_steps_workflow_order ON workflow_steps(workflow_id, step_order);

-- Partial Indexes
CREATE UNIQUE INDEX uq_active_workflow ON workflows (request_type_id) WHERE is_active = TRUE;
CREATE UNIQUE INDEX uq_active_form ON forms (request_type_id) WHERE is_active = TRUE;

-- =================================================================================
-- NHÓM 5: AUTHENTICATION & SECURITY TOKENS
-- =================================================================================

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);