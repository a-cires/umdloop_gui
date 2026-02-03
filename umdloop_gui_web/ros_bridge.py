# ros_bridge.py
import threading
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from msgs.action import NavigateToGPS


class RosGpsClient(Node):
    def __init__(self):
        super().__init__("umdloop_gui_ros_bridge")
        self._client = ActionClient(self, NavigateToGPS, "/navigate_to_gps")

    def send_gps_goal_blocking(self, lat, lon, tol=0.0, timeout_sec=60.0):
        if not self._client.wait_for_server(timeout_sec=2.0):
            return False, False, "navigate_to_gps action server not available"

        goal = NavigateToGPS.Goal()
        goal.latitude = float(lat)
        goal.longitude = float(lon)
        goal.position_tolerance = float(tol)

        send_future = self._client.send_goal_async(goal)
        rclpy.spin_until_future_complete(self, send_future, timeout_sec=5.0)
        if not send_future.done():
            return False, False, "Failed to send goal"

        goal_handle = send_future.result()
        if not goal_handle.accepted:
            return False, False, "Goal rejected"

        result_future = goal_handle.get_result_async()
        rclpy.spin_until_future_complete(self, result_future, timeout_sec=timeout_sec)
        if not result_future.done():
            return True, False, "Timed out waiting for result"

        result = result_future.result().result
        return True, bool(result.success), result.message


class RosContext:
    """
    Singleton-style ROS context manager
    """
    def __init__(self):
        self.node = None
        self.thread = None
        self.started = False

    def start(self):
        if self.started:
            return

        rclpy.init(args=None)
        self.node = RosGpsClient()

        self.thread = threading.Thread(
            target=rclpy.spin,
            args=(self.node,),
            daemon=True
        )
        self.thread.start()
        self.started = True

    def shutdown(self):
        if not self.started:
            return
        self.node.destroy_node()
        rclpy.shutdown()
        self.started = False


ros_context = RosContext()
