import requests
import sys
import json
from datetime import datetime

class JNVEditorialAPITester:
    def __init__(self, base_url="https://young-editorial-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_submission_id = None

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED {details}")
        else:
            print(f"❌ {test_name} - FAILED {details}")
        
    def run_api_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        
        if headers:
            request_headers.update(headers)
        if self.token and not headers:
            request_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=request_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_detail = response.json() if response.content else "No content"
                    details += f", Response: {error_detail}"
                except:
                    details += f", Raw: {response.text[:100]}"
            
            self.log_result(name, success, details)
            
            if success and response.content:
                return True, response.json()
            return success, {}

        except Exception as e:
            self.log_result(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test basic API connection"""
        success, response = self.run_api_test(
            "Root API Endpoint", 
            "GET", 
            "", 
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        success, response = self.run_api_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"username": "admin", "password": "jnv2024"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_result("Token Extraction", True, "Admin token obtained")
            return True
        else:
            self.log_result("Token Extraction", False, "No token in response")
            return False

    def test_invalid_admin_login(self):
        """Test admin login with invalid credentials"""
        success, _ = self.run_api_test(
            "Invalid Admin Login",
            "POST", 
            "admin/login",
            401,
            data={"username": "admin", "password": "wrong"}
        )
        return success

    def test_create_submission(self):
        """Test creating a new submission"""
        test_data = {
            "title": "Test Poem",
            "title_hi": "परीक्षा कविता",
            "content": "This is a test poem content\nWith multiple lines\nTo test the submission system.",
            "content_hi": "यह एक परीक्षा कविता है\nकई पंक्तियों के साथ\nसबमिशन सिस्टम का परीक्षण करने के लिए।",
            "author_name": "Test Student",
            "author_class": "10th A",
            "category": "poem",
            "language": "both"
        }
        
        success, response = self.run_api_test(
            "Create Submission",
            "POST",
            "submissions", 
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.test_submission_id = response['id']
            self.log_result("Submission ID Capture", True, f"ID: {self.test_submission_id}")
            return True
        return success

    def test_get_pending_submissions(self):
        """Test getting pending submissions (admin only)"""
        if not self.token:
            self.log_result("Get Pending Submissions", False, "No admin token")
            return False
            
        success, response = self.run_api_test(
            "Get Pending Submissions",
            "GET",
            "submissions/pending/list",
            200
        )
        
        if success:
            pending_count = len(response) if isinstance(response, list) else 0
            self.log_result("Pending Count Check", True, f"Found {pending_count} pending submissions")
        
        return success

    def test_get_stats(self):
        """Test getting stats (admin only)"""
        if not self.token:
            self.log_result("Get Stats", False, "No admin token")
            return False
            
        success, response = self.run_api_test(
            "Get Admin Stats",
            "GET",
            "stats",
            200
        )
        
        if success:
            required_fields = ['total_submissions', 'approved', 'pending', 'rejected']
            all_fields_present = all(field in response for field in required_fields)
            self.log_result("Stats Fields Check", all_fields_present, 
                          f"Stats: {response}" if all_fields_present else "Missing fields")
        
        return success

    def test_approve_submission(self):
        """Test approving a submission"""
        if not self.token or not self.test_submission_id:
            self.log_result("Approve Submission", False, "Missing token or submission ID")
            return False
            
        success, response = self.run_api_test(
            "Approve Submission",
            "PATCH",
            f"submissions/{self.test_submission_id}/approve",
            200,
            data={"admin_notes": "Approved for testing purposes"}
        )
        
        if success:
            status_check = response.get('status') == 'approved'
            self.log_result("Approval Status Check", status_check, 
                          f"Status: {response.get('status')}")
        
        return success

    def test_get_approved_submissions(self):
        """Test getting approved submissions (public)"""
        success, response = self.run_api_test(
            "Get Approved Submissions",
            "GET",
            "submissions?status=approved",
            200
        )
        
        if success:
            approved_count = len(response) if isinstance(response, list) else 0
            self.log_result("Approved Count Check", True, f"Found {approved_count} approved submissions")
        
        return success

    def test_get_submission_by_id(self):
        """Test getting a specific submission by ID"""
        if not self.test_submission_id:
            self.log_result("Get Submission by ID", False, "No submission ID available")
            return False
            
        success, response = self.run_api_test(
            "Get Submission by ID",
            "GET",
            f"submissions/{self.test_submission_id}",
            200
        )
        
        if success:
            title_check = response.get('title') == 'Test Poem'
            self.log_result("Submission Content Check", title_check,
                          f"Title: {response.get('title')}")
        
        return success

    def test_filter_submissions(self):
        """Test filtering submissions by category and language"""
        # Test category filter
        success1, _ = self.run_api_test(
            "Filter by Category",
            "GET",
            "submissions?status=approved&category=poem",
            200
        )
        
        # Test language filter
        success2, _ = self.run_api_test(
            "Filter by Language",
            "GET", 
            "submissions?status=approved&language=both",
            200
        )
        
        return success1 and success2

    def test_reject_submission(self):
        """Test rejecting a submission (create another one first)"""
        if not self.token:
            self.log_result("Reject Submission Setup", False, "No admin token")
            return False
            
        # Create another submission to reject
        reject_data = {
            "title": "Test Reject",
            "content": "This submission will be rejected",
            "author_name": "Reject Test",
            "author_class": "9th B",
            "category": "essay",
            "language": "english"
        }
        
        success, response = self.run_api_test(
            "Create Submission for Rejection",
            "POST",
            "submissions",
            200,
            data=reject_data
        )
        
        if not success or 'id' not in response:
            return False
            
        reject_id = response['id']
        
        # Now reject it
        success, response = self.run_api_test(
            "Reject Submission",
            "PATCH",
            f"submissions/{reject_id}/reject",
            200,
            data={"admin_notes": "Rejected for testing purposes"}
        )
        
        if success:
            status_check = response.get('status') == 'rejected'
            self.log_result("Rejection Status Check", status_check,
                          f"Status: {response.get('status')}")
        
        return success

    def test_search_functionality(self):
        """Test search API with different query types"""
        # Test search with title
        success1, response1 = self.run_api_test(
            "Search by Title",
            "GET",
            "search?q=Test Poem",
            200
        )
        
        # Test search with author name
        success2, response2 = self.run_api_test(
            "Search by Author",
            "GET",
            "search?q=Test Student",
            200
        )
        
        # Test search with Hindi content
        success3, response3 = self.run_api_test(
            "Search Hindi Content",
            "GET",
            "search?q=परीक्षा",
            200
        )
        
        # Test empty search
        success4, response4 = self.run_api_test(
            "Empty Search Query",
            "GET",
            "search?q=",
            200
        )
        
        if success4 and isinstance(response4, list):
            empty_check = len(response4) == 0
            self.log_result("Empty Search Response Check", empty_check, 
                          f"Expected empty array, got {len(response4)} items")
        
        return success1 and success2 and success3 and success4

    def test_student_profile(self):
        """Test student profile API"""
        # Test with approved student (Test Student should exist after approval)
        success1, response1 = self.run_api_test(
            "Get Student Profile",
            "GET", 
            "students/Test Student",
            200
        )
        
        if success1:
            required_fields = ['author_name', 'total_works', 'categories', 'works']
            fields_check = all(field in response1 for field in required_fields)
            self.log_result("Student Profile Fields Check", fields_check,
                          f"Profile: {response1.get('author_name')} - {response1.get('total_works')} works")
        
        # Test with non-existent student
        success2, _ = self.run_api_test(
            "Non-existent Student Profile",
            "GET",
            "students/NonExistentStudent",
            404
        )
        
        return success1 and success2

    def test_like_functionality(self):
        """Test like/unlike functionality on submissions"""
        if not self.test_submission_id:
            self.log_result("Like Functionality Test", False, "No submission ID available")
            return False
            
        test_user_id = "test_user_123"
        
        # Test liking a submission
        success1, response1 = self.run_api_test(
            "Like Submission",
            "POST",
            f"submissions/{self.test_submission_id}/like",
            200,
            data={"user_id": test_user_id}
        )
        
        if success1:
            action_check = response1.get('action') == 'liked'
            likes_check = response1.get('likes', 0) >= 1
            user_liked_check = response1.get('user_liked') == True
            self.log_result("Like Action Check", action_check and likes_check and user_liked_check,
                          f"Action: {response1.get('action')}, Likes: {response1.get('likes')}, User liked: {response1.get('user_liked')}")
        
        # Test unliking the same submission
        success2, response2 = self.run_api_test(
            "Unlike Submission",
            "POST",
            f"submissions/{self.test_submission_id}/like",
            200,
            data={"user_id": test_user_id}
        )
        
        if success2:
            action_check = response2.get('action') == 'unliked'
            user_liked_check = response2.get('user_liked') == False
            self.log_result("Unlike Action Check", action_check and user_liked_check,
                          f"Action: {response2.get('action')}, Likes: {response2.get('likes')}, User liked: {response2.get('user_liked')}")
        
        # Test liking again to leave it liked for frontend tests
        success3, _ = self.run_api_test(
            "Like Again for Frontend",
            "POST",
            f"submissions/{self.test_submission_id}/like",
            200,
            data={"user_id": test_user_id}
        )
        
        # Test liking non-existent submission
        success4, _ = self.run_api_test(
            "Like Non-existent Submission",
            "POST",
            "submissions/non-existent-id/like",
            404,
            data={"user_id": test_user_id}
        )
        
        return success1 and success2 and success3 and success4

    def test_comment_functionality(self):
        """Test comment functionality on submissions"""
        if not self.test_submission_id:
            self.log_result("Comment Functionality Test", False, "No submission ID available")
            return False
            
        # Test adding a comment
        comment_data = {
            "author_name": "Test Commenter",
            "comment_text": "This is a test comment on the submission. Great work!"
        }
        
        success1, response1 = self.run_api_test(
            "Add Comment to Submission",
            "POST",
            f"submissions/{self.test_submission_id}/comment",
            200,
            data=comment_data
        )
        
        comment_id = None
        if success1:
            required_fields = ['id', 'submission_id', 'author_name', 'comment_text', 'created_at']
            fields_check = all(field in response1 for field in required_fields)
            comment_id = response1.get('id')
            self.log_result("Comment Fields Check", fields_check,
                          f"Comment ID: {comment_id}, Author: {response1.get('author_name')}")
        
        # Test getting comments for the submission
        success2, response2 = self.run_api_test(
            "Get Comments for Submission",
            "GET",
            f"submissions/{self.test_submission_id}/comments",
            200
        )
        
        if success2 and isinstance(response2, list):
            comments_count = len(response2)
            has_our_comment = any(c.get('id') == comment_id for c in response2) if comment_id else False
            self.log_result("Comments Retrieval Check", comments_count >= 1 and has_our_comment,
                          f"Found {comments_count} comments, our comment present: {has_our_comment}")
        
        # Test adding another comment (bilingual)
        comment_data_hindi = {
            "author_name": "हिंदी टिप्पणीकार",
            "comment_text": "यह एक हिंदी टिप्पणी है। बहुत अच्छा काम!"
        }
        
        success3, response3 = self.run_api_test(
            "Add Hindi Comment",
            "POST",
            f"submissions/{self.test_submission_id}/comment",
            200,
            data=comment_data_hindi
        )
        
        # Test commenting on non-existent submission
        success4, _ = self.run_api_test(
            "Comment on Non-existent Submission",
            "POST",
            "submissions/non-existent-id/comment",
            404,
            data=comment_data
        )
        
        # Test invalid comment data (missing fields)
        success5, _ = self.run_api_test(
            "Invalid Comment Data",
            "POST",
            f"submissions/{self.test_submission_id}/comment",
            422,
            data={"author_name": "Test"}  # Missing comment_text
        )
        
        return success1 and success2 and success3 and success4 and success5

    def test_comment_deletion(self):
        """Test admin comment deletion functionality (NEW for iteration 4)"""
        if not self.test_submission_id or not self.token:
            self.log_result("Comment Deletion Test", False, "Missing submission ID or admin token")
            return False
            
        # First, create a comment to delete
        comment_data = {
            "author_name": "To Be Deleted",
            "comment_text": "This comment will be deleted by admin"
        }
        
        success1, response1 = self.run_api_test(
            "Create Comment for Deletion Test",
            "POST",
            f"submissions/{self.test_submission_id}/comment",
            200,
            data=comment_data
        )
        
        if not success1 or 'id' not in response1:
            return False
            
        delete_comment_id = response1['id']
        
        # Test admin deletion with valid token
        success2, response2 = self.run_api_test(
            "Admin Delete Comment",
            "DELETE",
            f"comments/{delete_comment_id}",
            200,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success2:
            message_check = 'deleted successfully' in str(response2.get('message', ''))
            deleted_id_check = response2.get('deleted_id') == delete_comment_id
            self.log_result("Delete Response Check", message_check and deleted_id_check,
                          f"Message: {response2.get('message')}, Deleted ID: {response2.get('deleted_id')}")
        
        # Test deletion of non-existent comment
        success3, _ = self.run_api_test(
            "Delete Non-existent Comment",
            "DELETE",
            "comments/non-existent-comment-id",
            404,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        # Test deletion without admin token (unauthorized)
        success4, _ = self.run_api_test(
            "Unauthorized Comment Deletion",
            "DELETE",
            f"comments/some-comment-id",
            401,
            headers={}  # No authorization header
        )
        
        # Test deletion with invalid token
        success5, _ = self.run_api_test(
            "Invalid Token Comment Deletion",
            "DELETE",
            f"comments/some-comment-id",
            401,
            headers={'Authorization': 'Bearer invalid-token'}
        )
        
        # Verify the comment was actually deleted by checking comments list
        success6, response6 = self.run_api_test(
            "Verify Comment Deletion",
            "GET",
            f"submissions/{self.test_submission_id}/comments",
            200
        )
        
        if success6 and isinstance(response6, list):
            deleted_comment_still_exists = any(c.get('id') == delete_comment_id for c in response6)
            self.log_result("Comment Actually Deleted", not deleted_comment_still_exists,
                          f"Deleted comment still in list: {deleted_comment_still_exists}")
            success6 = not deleted_comment_still_exists
        
        return success1 and success2 and success3 and success4 and success5 and success6

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting JNV Editorial Club API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ Basic API connection failed. Stopping tests.")
            return False
            
        # Authentication tests
        self.test_invalid_admin_login()
        if not self.test_admin_login():
            print("❌ Admin authentication failed. Stopping tests.")
            return False
            
        # Core functionality tests
        self.test_create_submission()
        self.test_get_pending_submissions()
        self.test_get_stats()
        self.test_approve_submission()
        self.test_get_approved_submissions()
        self.test_get_submission_by_id()
        self.test_filter_submissions()
        self.test_reject_submission()
        
        # New feature tests for iteration 2
        self.test_search_functionality()
        self.test_student_profile()
        
        # New feature tests for iteration 3 (Social engagement)
        self.test_like_functionality()
        self.test_comment_functionality()
        
        # Final summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API tests mostly successful!")
            return True
        else:
            print("⚠️ Multiple backend issues found.")
            return False

def main():
    tester = JNVEditorialAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())