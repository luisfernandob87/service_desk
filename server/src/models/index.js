const sequelize = require('../config/database');
const Organization = require('./Organization');
const User = require('./User');
const SupportGroup = require('./SupportGroup');
const UserGroup = require('./UserGroup');
const SupportGroupOrganization = require('./SupportGroupOrganization');
const Category = require('./Category');
const Service = require('./Service');
const Ticket = require('./Ticket');
const TicketComment = require('./TicketComment');
const TicketAttachment = require('./TicketAttachment');
const TicketRelation = require('./TicketRelation');
const ServiceOrganization = require('./ServiceOrganization');
const Notification = require('./Notification');
const Sla = require('./Sla');
const Approval = require('./Approval');
const ApprovalDefinition = require('./ApprovalDefinition');
const BusinessHour = require('./BusinessHour');
const Workflow = require('./Workflow');

/* Fase 1 associations */
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Organization.belongsToMany(SupportGroup, { through: SupportGroupOrganization, foreignKey: 'organization_id', otherKey: 'support_group_id', as: 'supportGroups' });
SupportGroup.belongsToMany(Organization, { through: SupportGroupOrganization, foreignKey: 'support_group_id', otherKey: 'organization_id', as: 'organizations' });

Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });

User.belongsToMany(SupportGroup, { through: UserGroup, foreignKey: 'user_id', otherKey: 'group_id', as: 'groups' });
SupportGroup.belongsToMany(User, { through: UserGroup, foreignKey: 'group_id', otherKey: 'user_id', as: 'members' });

/* Fase 2 associations */
Organization.belongsToMany(Service, { through: ServiceOrganization, foreignKey: 'organization_id', otherKey: 'service_id', as: 'services' });
Service.belongsToMany(Organization, { through: ServiceOrganization, foreignKey: 'service_id', otherKey: 'organization_id', as: 'organizations' });
Service.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Service, { foreignKey: 'category_id', as: 'services' });
Service.belongsTo(SupportGroup, { foreignKey: 'default_assigned_group_id', as: 'defaultGroup' });

Organization.hasMany(Ticket, { foreignKey: 'organization_id', as: 'tickets' });
Ticket.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Ticket.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Ticket.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
Ticket.belongsTo(SupportGroup, { foreignKey: 'assigned_group_id', as: 'assignedGroup' });
Ticket.belongsTo(User, { foreignKey: 'assigned_user_id', as: 'assignedUser' });

Ticket.hasMany(TicketComment, { foreignKey: 'ticket_id', as: 'comments' });
TicketComment.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
TicketComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Ticket.hasMany(TicketAttachment, { foreignKey: 'ticket_id', as: 'attachments' });
TicketAttachment.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
TicketAttachment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TicketRelation.belongsTo(Ticket, { foreignKey: 'parent_ticket_id', as: 'parentTicket' });
TicketRelation.belongsTo(Ticket, { foreignKey: 'child_ticket_id', as: 'childTicket' });
Ticket.hasMany(TicketRelation, { foreignKey: 'parent_ticket_id', as: 'childRelations' });
Ticket.hasMany(TicketRelation, { foreignKey: 'child_ticket_id', as: 'parentRelations' });

/* Fase 3 associations */
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Sla.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Service.hasOne(Sla, { foreignKey: 'service_id', as: 'sla' });
Sla.belongsTo(BusinessHour, { foreignKey: 'business_hour_id', as: 'businessHour' });
BusinessHour.hasMany(Sla, { foreignKey: 'business_hour_id', as: 'slas' });

/* Fase 4 associations */
Workflow.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Organization.hasMany(Workflow, { foreignKey: 'organization_id', as: 'workflows' });
Service.belongsTo(Workflow, { foreignKey: 'workflow_id', as: 'workflow' });
Workflow.hasMany(Service, { foreignKey: 'workflow_id', as: 'services' });

/* Workflow Execution associations (must be before Approval which references it) */
const WorkflowExecution = require('./WorkflowExecution');
WorkflowExecution.belongsTo(Workflow, { foreignKey: 'workflow_id', as: 'workflow' });
Workflow.hasMany(WorkflowExecution, { foreignKey: 'workflow_id', as: 'executions' });
WorkflowExecution.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
WorkflowExecution.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
WorkflowExecution.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
WorkflowExecution.belongsTo(SupportGroup, { foreignKey: 'assigned_group_id', as: 'assignedGroup' });
WorkflowExecution.hasMany(Ticket, { foreignKey: 'workflow_execution_id', as: 'tickets' });
Ticket.belongsTo(WorkflowExecution, { foreignKey: 'workflow_execution_id', as: 'execution' });

/* Approval associations */
WorkflowExecution.hasMany(Approval, { foreignKey: 'workflow_execution_id', as: 'approvals' });
Ticket.hasMany(Approval, { foreignKey: 'ticket_id', as: 'approvals' });
Approval.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
Approval.belongsTo(User, { foreignKey: 'requested_from', as: 'approver' });
Approval.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });
Approval.belongsTo(User, { foreignKey: 'responded_by', as: 'responder' });
Approval.belongsTo(SupportGroup, { foreignKey: 'assigned_group_id', as: 'assignedGroup' });
Approval.belongsTo(WorkflowExecution, { foreignKey: 'workflow_execution_id', as: 'execution' });

ApprovalDefinition.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Service.hasMany(ApprovalDefinition, { foreignKey: 'service_id', as: 'approvalDefinitions' });

module.exports = {
  sequelize,
  Organization,
  User,
  SupportGroup,
  UserGroup,
  Category,
  Service,
  Ticket,
  TicketComment,
  TicketAttachment,
  TicketRelation,
  ServiceOrganization,
  SupportGroupOrganization,
  Notification,
  Sla,
  Approval,
  ApprovalDefinition,
  BusinessHour,
  Workflow,
  WorkflowExecution,
};
