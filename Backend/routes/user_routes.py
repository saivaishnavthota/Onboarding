from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models.user_model import User
from models.onboarding_model import candidate
from schemas.user_schema import ResetPasswordResponse,ResetOnboardingPasswordRequest,UseronboardingResponse,UserCreate,VerifyOtpRequest,ChangePasswordRequest,ApproveDocsRequest,UsercreateResponse,UserHrAccept,HrApproveRequest, UserResponse, UserLogin, EmployeeOnboardingRequest,EmployeeOnboardingResponse,ResetPasswordRequest,EmployeeOnboardingRequest, ForgotPasswordRequest,Employee,AssignRequest,AssignResponse
from utils.email import send_login_email,send_onboarding_email,forgot_password_mail
from auth import get_current_user, create_access_token, verify_password, role_required, hash_password
from database import get_session
from datetime import datetime, timedelta
from sqlalchemy.sql import text
from models.employee_master_model import EmployeeMaster
from models.employee_details_model import EmployeeDetails, Location
from models.employee_assignment_model import EmployeeHR, EmployeeManager
from schemas.employee_master_schema import EmployeeMasterCreate, EmployeeMasterResponse
import logging
from utils.hash_utils import hash_password
import random
from typing import Union
from fastapi.security import OAuth2PasswordRequestForm
from utils.redis_client import redis_client
from utils.session_utils import create_session, invalidate_session

router = APIRouter(prefix="/users", tags=["Users"])


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



@router.post("/hr/approve", response_model=UserHrAccept)
async def hr_accept(data: HrApproveRequest, session: Session = Depends(get_session)):
    # Find employee
    user = db.query(users).filter(users.id == data.employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Update onboarding status
    employee.o_status = True
    session.commit()
    session.refresh(employee)

    return UserHrAccept(
        employee_id=employee.id,
        o_status=employee.o_status,
        message="Employee onboarding approved by HR"
    )

@router.post("/login", response_model=Union[UserResponse, UseronboardingResponse])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    email = form_data.username.strip().lower()
    password = form_data.password.strip()
    
    # ✅ Case 1: Onboarded User
    db_user = session.exec(select(User).where(User.company_email == email)).first()
    if db_user:
        if not verify_password(password, db_user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        #session_id, expires_at = create_session(db_user.id, db_user.role, "user", session)

        access_token = create_access_token(
            data={"sub": db_user.company_email, "role": db_user.role},
            expires_delta=timedelta(minutes=60)
        )

        return UserResponse(
            employeeId=db_user.id,
            name=db_user.name,
            role=db_user.role,
            email=db_user.company_email,
            access_token=access_token,
            onboarding_status=db_user.o_status,
            login_status=db_user.login_status,
            type=db_user.role,
            location_id=db_user.location_id,
            message=f"Welcome, {db_user.name}!"
        )

    # ✅ Case 2: Candidate
    onboarding_user = session.exec(select(candidate).where(candidate.email == email)).first()
    if onboarding_user:
        if not verify_password(password, onboarding_user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        session_id, expires_at = create_session(onboarding_user.id, onboarding_user.role, "candidate", session)

        access_token = create_access_token(
            data={"sub": onboarding_user.email, "session_id": session_id, "role": onboarding_user.role},
            expires_delta=timedelta(minutes=60)
        )

        return UseronboardingResponse(
            employeeId=onboarding_user.id,
            name=onboarding_user.name,
            email=onboarding_user.email,
            onboarding_status=onboarding_user.o_status,
            login_status=onboarding_user.login_status,
            role=onboarding_user.role,
            access_token=access_token,
            type=onboarding_user.role,
        )

    raise HTTPException(status_code=404, detail="User not found")

@router.post("/reset-onboarding-password")
async def reset_onboarding_password(
    req: ResetOnboardingPasswordRequest,
    session: Session = Depends(get_session),
):
    onboarding_user = session.get(candidate, req.employee_id)
    if not onboarding_user:
        raise HTTPException(status_code=404, detail="Onboarding employee not found")

    # Hash password
    hashed_pwd = hash_password(req.new_password)

    onboarding_user.password = hashed_pwd
    onboarding_user.login_status = True
    session.commit()
   
    return {"status": "success", "message": "Password set successfully. Please login again."}

# ----------------------------
# Reset Password
# ----------------------------

from utils.hash_utils import hash_password  # make sure you use hashing (bcrypt, passlib)
@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest, session: Session = Depends(get_session)):
    """
    Verify the OTP sent to the user's email
    """
    try:
        employee = session.exec(
            select(User).where(User.email == req.email.lower())
        ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Email not found")

        if employee.reset_otp != req.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")

       

        # Mark as verified (you can also store a flag in DB like otp_verified=True)
        return {"status": "success", "message": "OTP verified successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-password")
async def change_password(req: ChangePasswordRequest, session: Session = Depends(get_session)):
    """
    Change password after OTP verification
    """
    try:
        employee = session.exec(
            select(User).where(User.email == req.email.lower())
        ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Email not found")

        # Optional: you can require otp_verified flag here if you set it in verify_otp
        employee.password_hash = hash_password(req.new_password)
        employee.reset_otp = None
        employee.reset_otp_expires_at = None

        session.add(employee)
        session.commit()
        session.refresh(employee)

        return {"status": "success", "message": "Password updated successfully"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, session: Session = Depends(get_session)):
    try:
        employee = session.exec(select(User).where(User.email == req.email.lower())).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Email not found")

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        employee.reset_otp = otp
         # expires in 10 min

        session.add(employee)
        session.commit()
        session.refresh(employee)

        # Send OTP via email
        email_sent = await forgot_password_mail(req.email, f"Your OTP is {otp}")
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send email")

        return {"status": "success", "message": f"OTP sent to {req.email}"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/reset-password", response_model=ResetPasswordResponse)
def change_password(req: ResetPasswordRequest, session: Session = Depends(get_session)):
    employee = session.exec(
        select(User).where(User.company_email == req.email.lower())
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Email not found")

    # Verify old password
    if not verify_password(req.currentPassword, employee.password_hash):
        raise HTTPException(status_code=400, detail="Invalid old password")

    # Update password
    employee.password_hash = hash_password(req.new_password)
    employee.login_status = True  # Set login status to true after password change
    session.add(employee)
    session.commit()
    session.refresh(employee)

    return {"status": "success", "message": "Password changed successfully"}


@router.get("/managers")
async def display_managers(session: Session = Depends(get_session)):
    statement = select(User.id, User.name).where(User.role == "Manager")
    managers = session.exec(statement).all()
    manager_list = [{"id": m[0], "name": m[1]} for m in managers]
    return {"managers": manager_list}

# ----------------------------
# Get all HRs
# ----------------------------
@router.get("/hrs")
async def display_hrs(session: Session = Depends(get_session)):
    statement = select(User.id, User.name).where(User.role == "HR")
    hrs = session.exec(statement).all()
    hr_list = [{"id": h[0], "name": h[1]} for h in hrs]
    return {"HRs": hr_list}

# ----------------------------
# Get all employees with their assigned HRs and Managers
# ----------------------------
@router.get("/employees")
async def display_employees(session: Session = Depends(get_session)):
    query = text("""
        SELECT
            e.id AS employeeId,
           INITCAP(e.name) as name,
            e.company_email,
            e.email,
            e.role,
            -- Collect HR names linked to the employee
            COALESCE(array_agg(DISTINCT hr.name) FILTER (WHERE hr.id IS NOT NULL), '{}') AS hr,
            -- Collect Manager names linked to the employee
            COALESCE(array_agg(DISTINCT mgr.name) FILTER (WHERE mgr.id IS NOT NULL), '{}') AS managers
        FROM employees e
        LEFT JOIN employee_hrs eh ON e.id = eh.employee_id
        LEFT JOIN employees hr ON eh.hr_id = hr.id
        LEFT JOIN employee_managers em ON e.id = em.employee_id
        LEFT JOIN employees mgr ON em.manager_id = mgr.id
        GROUP BY e.id, e.name, e.email, e.role
        ORDER BY e.name;
    """)

    result = session.execute(query).all()
    employees = []
    for row in result:
        employees.append({
            "employeeId": row.employeeid,
            "name": row.name,
            "to_email"  : row.email,    
            "email": row.company_email,
            "role": row.role,
            "hr": row.hr,
            "managers": row.managers
        })
    return employees


# Get employee details endpoint
@router.get("/employee/{employee_id}")
async def get_employee_details(
    employee_id: int,
    session: Session = Depends(get_session)
):
    """
    Retrieve employee details by employee ID
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        with session.connection().connection.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    employee_id, full_name, contact_no, personal_email, 
                    doj, dob, address, gender, graduation_year, 
                    work_experience_years, emergency_contact_name, 
                    emergency_contact_number, emergency_contact_relation,
                    created_at
                FROM employee_details 
                WHERE employee_id = %s
                """,
                (employee_id,)
            )
            
            result = cur.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with ID {employee_id} not found"
                )
            
            # Convert result to dictionary
            columns = [
                'employee_id', 'full_name', 'contact_no', 'personal_email',
                'doj', 'dob', 'address', 'gender', 'graduation_year',
                'work_experience_years', 'emergency_contact_name',
                'emergency_contact_number', 'emergency_contact_relation',
                'created_at'
            ]
            
            employee_data = dict(zip(columns, result))
            
            return {
                "status": "success",
                "data": employee_data
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Update employee details endpoint
@router.put("/employee/{employee_id}")
async def update_employee_details(
    employee_id: int,
    employee_data: EmployeeOnboardingRequest,
    session: Session = Depends(get_session)
):
    """
    Update existing employee details
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        # Check if employee exists
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "SELECT employee_id FROM employee_details WHERE employee_id = %s",
                (employee_id,)
            )
            
            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with ID {employee_id} not found"
                )
            
            # Update employee details
            cur.execute(
                """
                UPDATE employee_details SET
                    full_name = %s,
                    contact_no = %s,
                    personal_email = %s,
                    doj = %s,
                    dob = %s,
                    address = %s,
                    gender = %s,
                    graduation_year = %s,
                    work_experience_years = %s,
                    emergency_contact_name = %s,
                    emergency_contact_number = %s,
                    emergency_contact_relation = %s,
                    updated_at = NOW()
                WHERE employee_id = %s
                """,
                (
                    employee_data.full_name,
                    employee_data.contact_no,
                    employee_data.personal_email,
                    employee_data.doj,
                    employee_data.dob,
                    employee_data.address,
                    employee_data.gender,
                    employee_data.graduation_year,
                    employee_data.work_experience_years,
                    employee_data.emergency_contact_name,
                    employee_data.emergency_contact_number,
                    employee_data.emergency_contact_relation,
                    employee_id
                )
            )
            
        session.commit()
        logger.info(f"Successfully updated employee ID: {employee_id}")
        
        return {
            "status": "success",
            "message": "Employee details updated successfully",
            "employee_id": employee_id
        }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

#changed
@router.get("/{employee_id}")
def get_employee_profile(employee_id: int, session: Session = Depends(get_session)):
    # employee core info
    employee = session.exec(select(User).where(User.id == employee_id)).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # managers and HRs from EmployeeMaster
    master = session.exec(select(EmployeeMaster).where(EmployeeMaster.emp_id == employee_id)).first()
    managers = []
    hrs = []

    if master:
        # managers from master table
        for mid in [master.manager1_id, master.manager2_id, master.manager3_id]:
            if mid:
                mgr = session.exec(select(User).where(User.id == mid)).first()
                if mgr:
                    managers.append(mgr.name)
        # HRs from master table
        for hid in [master.hr1_id, master.hr2_id]:
            if hid:
                hr = session.exec(select(User).where(User.id == hid)).first()
                if hr:
                    hrs.append(hr.name)

    # extra managers from EmployeeManager table
    extra_managers = session.exec(select(EmployeeManager).where(EmployeeManager.employee_id == employee_id)).all()
    for m in extra_managers:
        mgr = session.exec(select(User).where(User.id == m.manager_id)).first()
        if mgr and mgr.name not in managers:
            managers.append(mgr.name)

    # extra HRs from EmployeeHR table
    extra_hrs = session.exec(select(EmployeeHR).where(EmployeeHR.employee_id == employee_id)).all()
    for h in extra_hrs:
        hr = session.exec(select(User).where(User.id == h.hr_id)).first()
        if hr and hr.name not in hrs:
            hrs.append(hr.name)

    details = session.exec(select(EmployeeDetails).where(EmployeeDetails.employee_id == employee_id)).first()

    location_name = None
    if employee.location_id:
        location = session.exec(select(Location).where(Location.id == employee.location_id)).first()
        if location:
            location_name = location.name

    # full profile
    return {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "company_email": employee.company_email,
            "role": employee.role,
            "onboarding_status": employee.o_status,
            "managers": managers,
            "hrs": hrs,
            "employmentType": employee.employment_type if details else None,
            "contactNumber": details.contact_no if details else None,
            "dateOfJoining": employee.doj if details else None,
            "location": location_name
        }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user