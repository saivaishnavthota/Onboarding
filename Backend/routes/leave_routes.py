# app/routes/leave_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from sqlalchemy import text
from database import get_session
from models.leave_model import LeaveManagement
from models.user_model import User  # assuming you already have this
from schemas.leave_schema import LeaveCreate, LeaveResponse, LeaveApprovalCreate
from schemas.leave_balance_schema import LeaveBalanceResponse,LeaveBalance,LeaveBalanceUpdate
from models.employee_assignment_model import EmployeeManager, EmployeeHR
router = APIRouter()

# ------------------ EMPLOYEE APPLY LEAVE ------------------ #
@router.post("/apply_leave")
def apply_leave(leave: dict, session: Session = Depends(get_session)):
    try:
        result = session.execute(
            text("""
                SELECT * FROM apply_leave(
                    :employee_id, 
                    :leave_type, 
                    :reason, 
                    :start_date, 
                    :end_date
                )
            """),
            {
                "employee_id": leave["employee_id"],
                "leave_type": leave["leave_type"],
                "reason": leave["reason"],
                "start_date": leave["start_date"],
                "end_date": leave["end_date"],
            },
        )

        row = result.fetchone()
        session.commit()

        if not row:
            raise HTTPException(status_code=500, detail="Leave not created")

        # ✅ Map DB → frontend keys
        return {
            "id": row.id,
            "leaveType": row.leave_type,
            "startDate": row.start_date,
            "endDate": row.end_date,
            "totalDays": row.no_of_days,
           
            "reason": row.reason,
            "status": row.status
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error applying leave: {str(e)}")

# ------------------ EMPLOYEE LEAVE HISTORY ------------------ #
@router.get("/all_leaves/{employee_id}", response_model=list[LeaveResponse])
def get_all_leaves(employee_id: int, session: Session = Depends(get_session)):
    leaves = session.exec(
        select(LeaveManagement).where(LeaveManagement.employee_id == employee_id)
    ).all()
    return leaves


@router.get("/manager/pending-leaves/{manager_id}")
def get_manager_pending_leaves(manager_id: int, session: Session = Depends(get_session)):
    query = text("""
        SELECT lm.*, e.name AS employee_name, e.email AS employee_email
        FROM leave_management lm
        JOIN employees e ON lm.employee_id = e.id
        JOIN employee_managers em ON e.id = em.employee_id
        WHERE lm.manager_status = 'Pending'
          AND em.manager_id = :manager_id
    """)
    rows = session.execute(query, {"manager_id": manager_id}).mappings().all()
    return [dict(row) for row in rows]

@router.post("/manager/leave-action/{leave_id}")
def manager_leave_action(leave_id: int, data: dict, session: Session = Depends(get_session)):
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.manager_status = action
    leave.updated_at = datetime.now()

    if action == "Rejected":
        leave.status = "Rejected"

    session.add(leave)
    session.commit()
    return {"success": True, "message": f"Leave {action} by Manager"}


# ------------------ HR PENDING LEAVES ------------------ #
@router.get("/hr/pending-leaves/{hr_id}")
def get_hr_pending_leaves(hr_id: int, session: Session = Depends(get_session)):
    query = text("""
        SELECT lm.*, e.name AS employee_name, e.email AS employee_email
        FROM leave_management lm
        JOIN employees e ON lm.employee_id = e.id
        JOIN employee_hrs eh ON e.id = eh.employee_id
        WHERE lm.manager_status = 'Approved'
          AND lm.hr_status = 'Pending'
          AND eh.hr_id = :hr_id
    """)
    rows = session.execute(query, {"hr_id": hr_id}).mappings().all()
    return [dict(row) for row in rows]



# ------------------ HR ALL LEAVES ------------------ #
@router.post("/hr/leave-action/{leave_id}")
def hr_leave_action(leave_id: int, data: dict, session: Session = Depends(get_session)):
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.hr_status = action
    leave.updated_at = datetime.now()
    leave.status = action  # final status depends on HR decision

    session.add(leave)
    session.commit()
    return {"success": True, "message": f"Leave {action} by HR"}


@router.get("/leave-requests/{manager_id}")
def get_manager_leave_requests(manager_id: int, status: str = None, session: Session = Depends(get_session)):
    """
    Get all leave requests for employees assigned to this manager.
    Optional filter by status.
    """
    query = (
        select(LeaveManagement, User)
        .join(EmployeeManager, EmployeeManager.employee_id == LeaveManagement.employee_id)
        .join(User, User.id == LeaveManagement.employee_id)
        .where(EmployeeManager.manager_id == manager_id)
    )

    if status:
        query = query.where(LeaveManagement.manager_status == status)

    results = session.exec(query).all()

    return [
        {
            "leave_id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": emp.name,
            "leave_type": leave.leave_type,
            "reason": leave.reason,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "no_of_days": leave.no_of_days,
            "manager_status": leave.manager_status,
            "hr_status": leave.hr_status,
            "final_status": leave.status,
        }
        for leave, emp in results
    ]


@router.get("/leave-requests/{hr_id}")
def get_hr_leave_requests(hr_id: int, status: str = None, session: Session = Depends(get_session)):
    """
    Get all leave requests assigned to this HR after manager approval.
    """
    query = (
        select(LeaveManagement, User)
        .join(EmployeeHR, EmployeeHR.employee_id == LeaveManagement.employee_id)
        .join(User, User.id == LeaveManagement.employee_id)
        .where(EmployeeHR.hr_id == hr_id)
        .where(LeaveManagement.manager_status == "Approved")  # ✅ only after manager approval
    )
    
    if status:
        query = query.where(LeaveManagement.hr_status == status)

    results = session.exec(query).all()

    return [
        {
            "leave_id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": emp.name,
            "leave_type": leave.leave_type,
            "reason": leave.reason,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "no_of_days": leave.no_of_days,
            "manager_status": leave.manager_status,
            "hr_status": leave.hr_status,
            "final_status": leave.status,
        }
        for leave, emp in results
    ]


@router.get("/leave_balances/{employee_id}")
def get_leave_balance(employee_id: int, session: Session = Depends(get_session)):
    balance = session.exec(
        select(LeaveBalance).where(LeaveBalance.employee_id == employee_id)
    ).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")
    return balance

@router.post("/init/{employee_id}", response_model=LeaveBalanceResponse)
def init_leave_balance(employee_id: int, session: Session = Depends(get_session)):
    existing = session.query(LeaveBalance).filter_by(employee_id=employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Leave balance already exists")

    balance = LeaveBalance(
        employee_id=employee_id,
        sick_leaves=0,
        casual_leaves=0,
        paid_leaves=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(balance)
    session.commit()
    session.refresh(balance)
    return balance


# 3. Update leave balance (only sick, casual, paid)
@router.put("/leave-balance/{employee_id}", response_model=LeaveBalanceResponse)
def update_leave_balance(
    employee_id: int,
    updates: LeaveBalanceUpdate,
    session: Session = Depends(get_session),
):
    balance = session.query(LeaveBalance).filter_by(employee_id=employee_id).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")

    balance.sick_leaves = updates.sick_leaves
    balance.casual_leaves = updates.casual_leaves
    balance.paid_leaves = updates.paid_leaves
    balance.updated_at = datetime.utcnow()

    session.commit()
    session.refresh(balance)
    return balance