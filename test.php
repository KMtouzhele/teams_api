<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Random Color Hello World</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            text-align: center;
        }
        h1 {
            <?php
                // Generating a random color in hex format
                $random_color = sprintf('#%06X', mt_rand(0, 0xFFFFFF));
                echo "color: $random_color;";
            ?>
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <h2>
        <?php 
        //print out the php version
        echo "PHP Version: " . phpversion();
        ?>
    </div>
</body>
</html>