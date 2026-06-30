require('dotenv').config();
const { sequelize } = require('../models');

async function runMigrations() {
  try {
    console.log('Running migrations...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        logo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'end_user'
          CHECK (role IN ('admin', 'manager', 'resolver', 'end_user')),
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS support_groups (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE support_groups DROP CONSTRAINT IF EXISTS support_groups_organization_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE support_groups DROP COLUMN IF EXISTS organization_id;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS support_group_organizations (
        id SERIAL PRIMARY KEY,
        support_group_id INTEGER NOT NULL REFERENCES support_groups(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(support_group_id, organization_id)
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        group_id INTEGER NOT NULL REFERENCES support_groups(id),
        is_leader BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, group_id)
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_organization_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE categories DROP COLUMN IF EXISTS organization_id;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        short_description VARCHAR(300),
        icon VARCHAR(100),
        type VARCHAR(20) DEFAULT 'incident',
        default_assigned_group_id INTEGER REFERENCES support_groups(id),
        is_published BOOLEAN DEFAULT false,
        form_config JSONB DEFAULT '[]',
        workflow_config JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE services DROP COLUMN IF EXISTS organization_id;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE services ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'incident';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE services ADD COLUMN IF NOT EXISTS default_assigned_group_id INTEGER REFERENCES support_groups(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS service_organizations (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(service_id, organization_id)
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        service_id INTEGER REFERENCES services(id),
        requester_id INTEGER NOT NULL REFERENCES users(id),
        assigned_group_id INTEGER REFERENCES support_groups(id),
        assigned_user_id INTEGER REFERENCES users(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('incident','work_order','change_request','problem')),
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','in_progress','on_hold','resolved','closed','cancelled')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
        title VARCHAR(300) NOT NULL,
        description TEXT,
        form_data JSONB DEFAULT '{}',
        sla_response_deadline TIMESTAMP WITH TIME ZONE,
        sla_resolution_deadline TIMESTAMP WITH TIME ZONE,
        sla_breached BOOLEAN DEFAULT false,
        sla_paused_at TIMESTAMP WITH TIME ZONE,
        sla_paused_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`DO $$ BEGIN ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
    await sequelize.query(`DO $$ BEGIN ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_resolution_deadline TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
    await sequelize.query(`DO $$ BEGIN ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
    await sequelize.query(`DO $$ BEGIN ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_paused_at TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
    await sequelize.query(`DO $$ BEGIN ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_paused_minutes INTEGER DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
    await sequelize.query(`ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;`);
    await sequelize.query(`ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;`);
    await sequelize.query(`ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('new','in_progress','on_hold','resolved','closed','cancelled','reopened'));`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ticket_relations (
        id SERIAL PRIMARY KEY,
        parent_ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        child_ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        relation_type VARCHAR(20) DEFAULT 'relates_to'
          CHECK (relation_type IN ('relates_to','caused_by','duplicates','blocks')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(parent_ticket_id, child_ticket_id)
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(300) NOT NULL,
        message TEXT,
        link VARCHAR(500),
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        schedule JSONB DEFAULT '[{"day":1,"start":"08:00","end":"17:00"},{"day":2,"start":"08:00","end":"17:00"},{"day":3,"start":"08:00","end":"17:00"},{"day":4,"start":"08:00","end":"17:00"},{"day":5,"start":"08:00","end":"17:00"}]',
        timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`DROP TABLE IF EXISTS slas CASCADE;`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS slas (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        has_priorities BOOLEAN DEFAULT true,
        business_hour_id INTEGER REFERENCES business_hours(id),
        entries JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approval_definitions (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id),
        name VARCHAR(200) NOT NULL,
        stages JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approvals (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        stage VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending','approved','rejected','cancelled')),
        requested_from INTEGER NOT NULL REFERENCES users(id),
        requested_by INTEGER REFERENCES users(id),
        assigned_group_id INTEGER REFERENCES support_groups(id),
        comment TEXT,
        rejection_reason TEXT,
        workflow_execution_id INTEGER REFERENCES workflow_executions(id),
        source_node_id VARCHAR(100),
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        nodes JSONB DEFAULT '[]',
        edges JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS landing_config JSONB DEFAULT '[]';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE services ADD COLUMN IF NOT EXISTS workflow_id INTEGER REFERENCES workflows(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution TEXT;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES workflows(id),
        service_id INTEGER REFERENCES services(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        requester_id INTEGER NOT NULL REFERENCES users(id),
        assigned_group_id INTEGER REFERENCES support_groups(id),
        request_number VARCHAR(20),
        current_node_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','closed','cancelled')),
        context JSONB DEFAULT '{}',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS workflow_execution_id INTEGER REFERENCES workflow_executions(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source_node_id VARCHAR(100);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS assigned_group_id INTEGER REFERENCES support_groups(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS request_number VARCHAR(20);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS assigned_group_id INTEGER REFERENCES support_groups(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS workflow_execution_id INTEGER REFERENCES workflow_executions(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS source_node_id VARCHAR(100);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS code VARCHAR(20);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS code VARCHAR(20);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS responded_by INTEGER REFERENCES users(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS workflow_execution_id INTEGER REFERENCES workflow_executions(id) ON DELETE SET NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`ALTER TABLE approvals ALTER COLUMN ticket_id DROP NOT NULL;`);

    await sequelize.query(`
      UPDATE workflow_executions SET status = 'active' WHERE status = 'running';
    `);
    await sequelize.query(`
      ALTER TABLE workflow_executions DROP CONSTRAINT IF EXISTS workflow_executions_status_check;
    `);
    await sequelize.query(`
      ALTER TABLE workflow_executions ADD CONSTRAINT workflow_executions_status_check
        CHECK (status IN ('active','on_hold','completed','closed','cancelled'));
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS parent_execution_id INTEGER REFERENCES workflow_executions(id) ON DELETE SET NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'service';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
    `);
    await sequelize.query(`
      ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('service', 'solution', 'both'));
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        config JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE services ADD COLUMN IF NOT EXISTS form_template_id INTEGER REFERENCES form_templates(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS business_units (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        business_unit_id INTEGER NOT NULL REFERENCES business_units(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS business_unit_id INTEGER REFERENCES business_units(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES positions(id);
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS login_config JSONB DEFAULT '{}';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;
