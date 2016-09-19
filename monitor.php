<head></head>
<body>
<?PHP

$file = fopen("output.txt","a");
fwrite($file,"teste");
fclose($file);

function debug_to_console( $data ) {

    if ( is_array( $data ) )
        $output = "<script>console.log( 'Debug Objects: " . implode( ',', $data) . "' );</script>";
    else
        $output = "<script>console.log( 'Debug Objects: " . $data . "' );</script>";

    echo $output;
}

debug_to_console("Test");
/*
$action = $_POST['user_action'];
$request = $_POST['request'];
$string = $action + " " + $request;
$file = fopen("users_log.txt","a");
if(fwrite($file,$string)){
	echo "written to file";
}
fclose($file);
*/
?>
</body>